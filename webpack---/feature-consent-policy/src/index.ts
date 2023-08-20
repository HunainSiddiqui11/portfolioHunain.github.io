import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { WixCodeSdkHandlersProviderSym, LifeCycle, ConsentPolicySymbol } from '@wix/thunderbolt-symbols'
import { ConsentPolicyBrowser } from './consentPolicyBrowser'
import { ConsentPolicyAppMountHandler } from './consentPolicyAppMountHandler'
import { ConsentPolicySdkHandlersProvider } from './consentPolicySdkHandlersProvider'
import { UOUConsentPolicySettingsModalSymbol } from './symbols'
import { UOUConsentPolicySettingsModal } from './uouConsentPolicySettingsModal'

export const site: ContainerModuleLoader = (bind) => {
	bind(ConsentPolicySymbol).to(ConsentPolicyBrowser)
	bind(WixCodeSdkHandlersProviderSym).to(ConsentPolicySdkHandlersProvider)
	bind(LifeCycle.AppWillMountHandler).to(ConsentPolicyAppMountHandler)
	bind(UOUConsentPolicySettingsModalSymbol).to(UOUConsentPolicySettingsModal)
}

export const editor = site

export * from './types'
export * from './symbols'
export * from './reactNative/uouConsentPolicySettingsModalMock'
