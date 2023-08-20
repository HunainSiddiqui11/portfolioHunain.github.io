import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	SiteFeatureConfigSymbol,
	FeatureExportsSymbol,
	IAppWillMountHandler,
	ExperimentsSymbol,
	Experiments,
	ConsentPolicySymbol,
} from '@wix/thunderbolt-symbols'
import type { IConsentPolicy, ConsentPolicySiteConfig, IUOUConsentPolicySettingsModal } from './types'
import { name, UOUConsentPolicySettingsModalSymbol } from './symbols'
import { IFeatureExportsStore } from 'thunderbolt-feature-exports'
import { getDefaultConsentPolicyToExport } from './consentPolicyUtils'

export const ConsentPolicyAppMountHandler = withDependencies<IAppWillMountHandler>(
	[
		named(SiteFeatureConfigSymbol, name),
		ConsentPolicySymbol,
		named(FeatureExportsSymbol, name),
		ExperimentsSymbol,
		UOUConsentPolicySettingsModalSymbol,
	],
	(
		config: ConsentPolicySiteConfig,
		consentPolicyAPI: IConsentPolicy,
		consentPolicyExports: IFeatureExportsStore<typeof name>,
		experiments: Experiments,
		uouConsentPolicySettingsModal: IUOUConsentPolicySettingsModal
	) => {
		return {
			appWillMount() {
				const shouldExportCurrentConsentPolicy =
					experiments['specs.thunderbolt.shouldExportCurrentConsentPolicy']
				const currentConsentPolicy = shouldExportCurrentConsentPolicy
					? consentPolicyAPI.getCurrentConsentPolicy()
					: getDefaultConsentPolicyToExport(config)
				consentPolicyExports.export({
					currentConsentPolicy,
					openSettingModal: () => uouConsentPolicySettingsModal.open(),
				})
			},
		}
	}
)
