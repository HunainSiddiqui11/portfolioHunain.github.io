import _ from 'lodash'
import { withDependencies, named } from '@wix/thunderbolt-ioc'
import {
	CurrentRouteInfoSymbol,
	Experiments,
	ExperimentsSymbol,
	MasterPageFeatureConfigSymbol,
	SiteFeatureConfigSymbol,
} from '@wix/thunderbolt-symbols'
import { name, UrlHistoryManagerSymbol } from './symbols'
import type { ICurrentRouteInfo, IRoutingConfig, IRoutingLinkUtilsAPI, IUrlHistoryManager } from './types'
import { resolveUrl } from './resolveUrl'
import { RouterMasterPageConfig } from './types'

const RoutingLinkUtilsAPIFactory = (
	routingConfig: IRoutingConfig,
	urlHistoryManager: IUrlHistoryManager,
	currentRouteInfo: ICurrentRouteInfo,
	experiments: Experiments,
	masterPageConfig: RouterMasterPageConfig
): IRoutingLinkUtilsAPI => {
	const supportUrlHierarchy = !!experiments['specs.thunderbolt.url_hierarchy']
	return {
		getLinkUtilsRoutingInfo() {
			const { pageId } =
				currentRouteInfo.getCurrentRouteInfo() ||
				resolveUrl(urlHistoryManager.getParsedUrl().href, routingConfig, { supportUrlHierarchy })

			const { mainPageId, pagesMap, routes, pageIdToPrefix, baseUrl } = routingConfig
			return {
				mainPageId,
				pages: pagesMap,
				routes: _.omitBy(routes, (__, key) => key === './'),
				pageIdToPrefix,
				pageId: pageId!,
				relativeUrl: urlHistoryManager.getRelativeUrl(),
				externalBaseUrl: baseUrl,
				pagesUriSEOs: masterPageConfig.pagesUriSeoML.primaryToCurrentLang,
			}
		},
	}
}
export const RoutingLinkUtilsAPI = withDependencies(
	[
		named(SiteFeatureConfigSymbol, name),
		UrlHistoryManagerSymbol,
		CurrentRouteInfoSymbol,
		ExperimentsSymbol,
		named(MasterPageFeatureConfigSymbol, name),
	],
	RoutingLinkUtilsAPIFactory
)
