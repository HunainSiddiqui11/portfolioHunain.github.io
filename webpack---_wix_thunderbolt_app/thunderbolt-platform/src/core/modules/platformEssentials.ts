import type { BootstrapData } from '../../types'
import type { SessionServiceAPI } from '@wix/thunderbolt-symbols'
import { ViewerPlatformEssentials } from '@wix/fe-essentials-viewer-platform'
import { BOOTSTRAP_DATA, SESSION_SERVICE, PLATFORM_ESSENTIALS } from './moduleNames'
import type { HttpClientOptions } from '@wix/fe-essentials-viewer-platform/http-client'

function PlatformEssentials(bootstrapData: BootstrapData, sessionService: SessionServiceAPI) {
	const {
		platformEnvData: {
			site: { experiments },
			location: { externalBaseUrl },
			window: { isSSR },
			multilingual,
		},
	} = bootstrapData

	const setBaseUrlToExternalBaseUrl = experiments['specs.thunderbolt.essentials_base_url_external_base_url']
	const baseUrl = setBaseUrlToExternalBaseUrl ? externalBaseUrl : isSSR ? new URL(externalBaseUrl).origin : ''

	const getMultilingualOptions = (): HttpClientOptions['multilingualOptions'] => {
		if (!multilingual) {
			return
		}

		const {
			currentLanguage: { languageCode: lang, locale, isPrimaryLanguage },
		} = multilingual

		return {
			lang,
			locale,
			isPrimaryLanguage,
		}
	}

	return new ViewerPlatformEssentials({
		conductedExperiments: experiments,
		isSSR,
		baseUrl,
		multilingualOptions: getMultilingualOptions(),
		metaSiteId: bootstrapData.platformEnvData.location.metaSiteId,
		appsConductedExperiments: bootstrapData.essentials.appsConductedExperiments,
		fetch: self.fetch,
		getAppToken(appDefId) {
			return sessionService.getInstance(appDefId)
		},
	})
}

export default {
	factory: PlatformEssentials,
	deps: [BOOTSTRAP_DATA, SESSION_SERVICE],
	name: PLATFORM_ESSENTIALS,
}
