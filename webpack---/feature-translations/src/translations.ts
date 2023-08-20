import { named, withDependencies } from '@wix/thunderbolt-ioc'
import {
	Experiments,
	ExperimentsSymbol,
	FeatureStateSymbol,
	ILanguage,
	ILogger,
	IPageDidMountHandler,
	IRendererPropsExtender,
	ITranslate,
	ITranslationsFetcher,
	LanguageSymbol,
	LoggerSymbol,
	MasterPageFeatureConfigSymbol,
	pageIdSym,
	Translate,
} from '@wix/thunderbolt-symbols'
import type { TranslationsFeatureState } from './types'
import { IFeatureState } from 'thunderbolt-feature-state'
import { name as translationFeatureName } from './symbols'
import { TranslationMasterPageConfig } from './types'
import { INavigationManager, NavigationManagerSymbol } from 'feature-navigation-manager'
import { getTranslation } from './translationsUrl'

export const TranslationsImpl = withDependencies(
	[LanguageSymbol, named(FeatureStateSymbol, translationFeatureName), ExperimentsSymbol],
	(
		{ userLanguage }: ILanguage,
		featureState: IFeatureState<TranslationsFeatureState>,
		experiments: Experiments
	): (() => Promise<ITranslate>) => {
		return async () => {
			const isRemoveTranslationLoadingInClientEnabled = !!experiments[
				'specs.thunderbolt.removeTranslationLoadingInClient'
			]
			if (!featureState.get()?.translations) {
				featureState.update(() => ({
					translations: isRemoveTranslationLoadingInClientEnabled
						? Promise.resolve({})
						: getTranslation(userLanguage),
				}))
			}

			const translations = await featureState.get().translations
			return (featureNamespace, key, defaultValue) =>
				(translations[featureNamespace] && translations[featureNamespace][key]) || defaultValue
		}
	}
)

export const TranslateBinder = withDependencies(
	[Translate],
	(translationsFetcher: ITranslationsFetcher): IRendererPropsExtender => ({
		async extendRendererProps() {
			return { translate: await translationsFetcher() }
		},
	})
)

export const CorruptedTranslationsBI = withDependencies(
	[named(MasterPageFeatureConfigSymbol, translationFeatureName), LoggerSymbol, pageIdSym, NavigationManagerSymbol],
	(
		masterPageConfig: TranslationMasterPageConfig,
		logger: ILogger,
		pageIdSymbol: string,
		navigationManager: INavigationManager
	): IPageDidMountHandler => {
		return {
			pageDidMount() {
				if (navigationManager.isFirstNavigation() && pageIdSymbol === 'masterPage') {
					const { isPageUriSEOTranslated, hasOriginalLanguageTranslation } = masterPageConfig
					logger.meter('translationCorruption', {
						customParams: { isPageUriSEOTranslated, hasOriginalLanguageTranslation },
					})
				}
			},
		}
	}
)
