import { withDependencies } from '@wix/thunderbolt-ioc'
import { BrowserWindowSymbol } from '@wix/thunderbolt-symbols'
import type { IUOUConsentPolicySettingsModal } from './types'

export const UOUConsentPolicySettingsModal = withDependencies<IUOUConsentPolicySettingsModal>(
	[BrowserWindowSymbol],
	(browserWindow) => {
		return {
			open() {
				// this package is imported in client runtime only and not in build time because NPM dependencies are considered
				// external in webpack compilation and because this package imports SCSS files which aren't transpiled
				// by thunderbolt server, the server compilation fails.
				return browserWindow ? require('@wix/cookie-consent-settings-for-uou').default() : () => {}
			},
		}
	}
)
