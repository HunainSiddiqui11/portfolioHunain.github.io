import { Experiments, ILogger, IReporterApi } from '@wix/thunderbolt-symbols'
import { getTrackEventParams, TRACK_EVENTS } from './constants'
import { CombinedCollectionSettings, ICaptchaSettings, IDPConnection, ISiteMembersSettings } from './types'
import { getCaptchaSettings, getPerformFetch } from './utils'

export const SiteMembersSettingsService = (
	performFetch: ReturnType<typeof getPerformFetch>,
	logger: ILogger,
	reporter: IReporterApi,
	experiments: Experiments,
	metasiteInstance?: string
) => {
	let siteMembersSettings: ISiteMembersSettings | undefined
	let combinedCollectionSettings: CombinedCollectionSettings | undefined

	const siteMembersSettingsUrl = '/_api/wix-sm-webapp/v1/collection/settings'
	const collectionSettingsUrl = '/_serverless/collection-settings-facade/get-settings'

	const getCombinedCollectionSettings = async (): Promise<CombinedCollectionSettings> => {
		if (combinedCollectionSettings) {
			return combinedCollectionSettings
		}

		return performFetch(collectionSettingsUrl, {
			headers: {
				'Content-Type': 'application/json',
				authorization: metasiteInstance || '',
			},
		}).then((settings: CombinedCollectionSettings) => {
			combinedCollectionSettings = settings
			return combinedCollectionSettings
		})
	}

	const getSiteMembersSettings = async (): Promise<ISiteMembersSettings> => {
		if (experiments['specs.thunderbolt.useIAMEnabledConnections']) {
			return getCombinedCollectionSettings().then((settings) => settings.collectionSettings)
		}

		if (siteMembersSettings) {
			return siteMembersSettings
		}
		return performFetch(siteMembersSettingsUrl, {
			headers: {
				'Content-Type': 'application/json',
				authorization: metasiteInstance || '',
			},
		})
			.then((res: { settings: ISiteMembersSettings }) => res.settings)
			.then((settings: ISiteMembersSettings) => {
				siteMembersSettings = settings
				return settings
			})
	}
	return {
		getSiteMembersSettings,
		getCaptchaSettings: (): Promise<ICaptchaSettings> => {
			return getSiteMembersSettings()
				.then(getCaptchaSettings)
				.catch((error) => {
					logger.captureError(error as Error, { tags: { feature: 'site-members' } })
					reporter.trackEvent(getTrackEventParams(TRACK_EVENTS.ACTIONS.SETTINGS.FAIL))
					return {
						invisible: { login: false, signup: false },
						visible: { login: false, signup: true },
					}
				})
		},
		getEnabledConnections: (): Promise<Array<IDPConnection>> => {
			return getCombinedCollectionSettings().then((settings) => settings.enabledConnections ?? [])
		},
	}
}
