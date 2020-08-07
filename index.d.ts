type DirectLyEnabled = boolean
type EnabledEnvironments = { [k: string]: boolean }
export type Flag = {enabled: DirectLyEnabled | EnabledEnvironments, description: string, name?: string }

type CurrentEnvironment = Readonly<{current: string }>
type AvailableEnvironments = string[];
type Environments = Readonly<{available: AvailableEnvironments} & CurrentEnvironment>

type FlagWithEnvironment = Readonly<{
  environment_flag: string
}>


export interface Config {
  flags: { [key: string]: Flag },
  environments?: Environments,
  sources?: Source[]
}

type SourceFn = (flag: Flag) => boolean
type SourceObject = Readonly<{isEnabled: SourceFn}>
type Source = SourceFn | SourceObject

type State = Flag[]
type ChangedFlag<TFlagName> = {flag: TFlagName, originalValue: boolean}

interface TestBox<TFlagName> {
  enable: (flag: TFlagName) => void
  disable: (flag: TFlagName) => void
  reset: () => void
}

type SyncTogglingClosure<TFlagName> = <TResult>(name: TFlagName, closure: () => TResult) =>  TResult
type AsyncTogglingClosure<TFlagName> = <TResult>(name: TFlagName, closure: () => Promise<TResult>) => Promise<TResult>

export interface FeatureFlags<TConfig extends Config, TFlagName extends keyof TConfig["flags"] & string> {
  isEnabled: (key: TFlagName) => boolean,
  summary: () => string,
  state: () => State,
  enabling: SyncTogglingClosure<TFlagName>
  disabling:SyncTogglingClosure<TFlagName>
  enablingAsync: AsyncTogglingClosure<TFlagName>
  disablingAsync: AsyncTogglingClosure<TFlagName>
  testBox: () => TestBox<TFlagName>,
}
 export declare function wrap<TConfig extends Config, TFlagName extends keyof TConfig["flags"] & string>(config: TConfig): FeatureFlags<TConfig, TFlagName>;

export declare namespace sources {
  export function processEnvSource(flag: any): boolean
}
