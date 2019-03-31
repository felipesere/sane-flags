// @ts-ignore
import AsciiTable from 'ascii-table'

const errors = {
  unknown_feature: (flagName: string) =>
    `There is no feature named '${flagName}'. Check in your features file to see if there was a spelling mistake.`,
  missing_description: (flagName: string) =>
    `The feature flag ${flagName} did not have a 'description'. Please ensure you describe a feature flag in a few words to allow fellow engineers to avoid guessing`,
  missing_enabled: (flagName: string) =>
    `The feature flag ${flagName} has no key 'enabled'. It is a healthy practice to make statements about the state of the flag explicit. If you rely on a source to enable it, at least mark it as 'enabled: false' in the config.`,
  unknown_env_enabled: (flagName: string, envInFlag: string, configuredEnvs: string[]) =>
    `The feature flag ${flagName} is configured for ${envInFlag} that is not listed in environments.available: ${configuredEnvs}. Please check if this is an error.`,
  missing_environment: () =>
    'You need to configure which environments are available to your application under config.environments.available as an array of strings. This allows us to check your config for consistency'
}

type DirectLyEnabled = boolean
type EnabledEnvironments = { [k: string]: boolean }
export type Flag = {enabled: DirectLyEnabled | EnabledEnvironments, description: string, name?: string }

type Flags = {[l:string]:Flag}

type CurrentEnvironment = Readonly<{current: string }>
type AvailableEnvironments = string[];
type Environments = Readonly<{available: AvailableEnvironments} & CurrentEnvironment>

type FlagWithEnvironment = Readonly<{
  environment_flag: string
}>


export interface Config {
  flags: Flags,
  environments?: Environments,
  sources?: Source[]
}

type SourceFn = (flag: Flag) => boolean
type SourceObject = Readonly<{isEnabled: SourceFn}>
type Source = SourceFn | SourceObject

type State = Flag[]
type ChangedFlag = {flag: string, originalValue: boolean}

interface TestBox {
  enable: (flag: string) => void
  disable: (flag: string) => void
  reset: () => void
}

type SyncTogglingClosure = <TResult>(name: string, closure: () => TResult) =>  TResult
type AsyncTogglingClosure = <TResult>(name: string, closure: () => Promise<TResult>) => Promise<TResult>

export interface FeatureFlags {
  isEnabled: (k: string) => boolean,
  summary: () => string,
  state: () => State,
  enabling: SyncTogglingClosure
  disabling:SyncTogglingClosure
  enablingAsync: AsyncTogglingClosure
  disablingAsync: AsyncTogglingClosure
  testBox: () => TestBox,
}

const checkConsistency = (config: Config) => {
  for (const flagName in config.flags) {
    const flag = config.flags[flagName]
    if (!flag.hasOwnProperty('description')) {
      throw errors.missing_description(flagName)
    }

    if (!flag.hasOwnProperty('enabled')) {
      throw errors.missing_enabled(flagName)
    }

    if (typeof flag.enabled === 'object') {
      if (config.environments) {
        const configuredEnvs = config.environments.available || []
        for (const envInFlag in flag.enabled) {
          if (!configuredEnvs.some((env) => env === envInFlag)) {
            throw errors.unknown_env_enabled(flagName, envInFlag, configuredEnvs)
          }
        }
      } else {
        throw errors.missing_environment()
      }
    }
  }
}

const checkSources = (sources: Source[], flag: Flag) => {
  for (const source of sources) {
    if (typeof source === 'function' && source(flag)) {
      return true
    }
    if (typeof source === 'object' && source.isEnabled(flag)) {
      return true
    }
  }
}

const hardEnabled = (environments: CurrentEnvironment | undefined, flag: Flag) => {
  if (typeof flag.enabled === 'boolean') {
    return flag.enabled
  }

  if (environments) {
    let current: string = environments.current
    return flag.enabled[current]
  }
}

type ToggledFlag<TResult> = Readonly<{to: boolean, around: () => TResult}>

export const saneFlags = {
  wrap: (config: Config): FeatureFlags => {
    checkConsistency(config)
    const { flags, sources = [], environments } = config

    const toggle = <TResult>(self: FeatureFlags, flagName: string, { to: value, around: closure }: ToggledFlag<TResult>): TResult => {
      const oldFlagValue = self.isEnabled(flagName)
      flags[flagName].enabled = value

      try {
        return closure()
      } finally {
        flags[flagName].enabled = oldFlagValue
      }
    }

    const toggleAsync = async <TResult>(self: FeatureFlags, flagName: string, { to: value , around: closure }: ToggledFlag<Promise<TResult>> ): Promise<TResult> => {
      const oldFlagValue = self.isEnabled(flagName)
      flags[flagName].enabled = value

      try {
        return await closure()
      } finally {
        flags[flagName].enabled = oldFlagValue
      }
    }

    return {
      isEnabled: (flagName: string) => {
        const flag = flags[flagName]
        if (flag) {
          flag.name = flagName
          return (
            hardEnabled(environments, flag) ||
            checkSources(sources, flag) ||
            false
          )
        } else {
          throw errors.unknown_feature(flagName)
        }
      },

      summary: function() {
        const self: FeatureFlags = this;
        const table = new AsciiTable('Tracked features')
        table.setHeading('name', 'description', 'enabled?')

        for (const flagName in flags) {
          const flag = flags[flagName]
          table.addRow(flagName, flag.description, self.isEnabled(flagName))
        }
        return table.toString()
      },

      state: function() {
        const features: FeatureFlags = this
        return Object.keys(flags).map((flagName) => {
          return {
            name: flagName,
            enabled: features.isEnabled(flagName),
            description: flags[flagName].description
          }
        })
      },

      enabling: function(flagName, closure) {
        return toggle(this, flagName, { to: true, around: closure })
      },

      disabling: function(flagName, closure) {
        return toggle(this, flagName, { to: false, around: closure })
      },

      enablingAsync: async function(flagName, closure) {
        return toggleAsync(this, flagName, { to: true, around: closure })
      },

      disablingAsync: async function(flagName, closure) {
        return toggleAsync(this, flagName, { to: false, around: closure })
      },

      testBox: function() {
        const features: FeatureFlags = this
        let changedFlags: ChangedFlag[] = []
        const set = (flagName: string, { to: value }: {to: boolean}) => {
          const isEnabled = features.isEnabled(flagName)
          changedFlags = changedFlags.concat({
            flag: flagName,
            originalValue: isEnabled
          })
          flags[flagName].enabled = value
        }

        return {
          enable: (flagName) => set(flagName, { to: true }),

          disable: (flagName) => set(flagName, { to: false }),

          reset: () => {
            changedFlags.forEach(
              ({ flag, originalValue }) => (flags[flag].enabled = originalValue)
            )

            changedFlags = []
          }
        }
      }
    }
  },
  sources: {
    processEnvSource: (flag: FlagWithEnvironment) => {
      const value = process.env[flag.environment_flag] as string
      return value === '1' || value === 'true'
    }
  }
}
