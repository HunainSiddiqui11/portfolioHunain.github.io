import type { IRoutingConfig, Route, CandidateRouteInfo } from './types'
import { queryParamsWhitelist as defaultQueryParamsWhitelist, overrideSuffix } from './queryParamsWhitelist'
import {
	resolveQueryParams,
	removeProtocol,
	replaceProtocol,
	convertHashBangUrlToSlashUrl,
	getRelativeUrlData,
	decodeUriComponentIfEncoded,
} from './urlUtils'
import { UrlResolvingOptions } from './types'

const isInternalUrl = (url: string, baseUrl: string): boolean => {
	const parsedUrl = new URL(url, `${baseUrl}/`)
	const parsedBaseUrl = new URL(baseUrl)
	return parsedUrl.host === parsedBaseUrl.host && parsedUrl.pathname.startsWith(parsedBaseUrl.pathname)
}

const getRouteData = (
	relativePathnameParts: Array<string>,
	routes: IRoutingConfig['routes'],
	supportUrlHierarchy: boolean
): Route | undefined => {
	if (supportUrlHierarchy) {
		const decodedRelativePathnameParts = relativePathnameParts.map(decodeUriComponentIfEncoded)
		const dynamicPageRouteKey = `./${decodedRelativePathnameParts[0]}`
		const routeKey = `./${decodedRelativePathnameParts.join('/')}`

		return routes[routeKey] || routes[dynamicPageRouteKey]
	} else {
		const routeKey = `./${relativePathnameParts[0]}`

		return routes[routeKey]
	}
}

export const keepInternalQueryParamsOnly = (
	searchParams: URLSearchParams,
	queryParamsWhitelist: Set<string> = defaultQueryParamsWhitelist
) => {
	// @ts-ignore - ts thinks there's no entries() on searchParams, but it's there.
	const entries = searchParams.entries()
	const filteredEntries = [...entries].filter(
		([key]) => queryParamsWhitelist.has(key) || key.endsWith(overrideSuffix)
	)
	return new URLSearchParams(filteredEntries).toString()
}

const isUrlOnSameWixSite = (candidateUrl: string, baseUrl: string) => {
	const candidateUrlWithNoProtocol = removeProtocol(candidateUrl)
	const baseUrlWithNoProtocol = removeProtocol(baseUrl)

	return candidateUrlWithNoProtocol.startsWith(baseUrlWithNoProtocol)
}

const fixSameWixSiteCandidateUrl = (candidateUrl: string, siteProtocol: string) => {
	const candidateSlashUrl = convertHashBangUrlToSlashUrl(candidateUrl)
	return replaceProtocol(candidateSlashUrl, siteProtocol)
}

export const resolveUrl = (
	url: string,
	routingConfig: IRoutingConfig,
	options: UrlResolvingOptions
): Partial<CandidateRouteInfo> => {
	const { currentParsedUrl, queryParamsWhitelist, supportUrlHierarchy } = {
		queryParamsWhitelist: defaultQueryParamsWhitelist,
		...options,
	}

	const isHomePageUrl = url === routingConfig.baseUrl
	const queryParams = currentParsedUrl
		? keepInternalQueryParamsOnly(currentParsedUrl.searchParams, queryParamsWhitelist)
		: ''

	// should resolve to base url on home page url, otherwise we get extra slash on navigation
	const candidateUrl = isHomePageUrl ? routingConfig.baseUrl : url
	const urlToParse = isUrlOnSameWixSite(candidateUrl, routingConfig.baseUrl)
		? fixSameWixSiteCandidateUrl(candidateUrl, new URL(routingConfig.baseUrl).protocol)
		: candidateUrl

	const parsedUrl = new URL(urlToParse, `${routingConfig.baseUrl}/`)
	parsedUrl.search = resolveQueryParams(parsedUrl.search, queryParams)

	if (!isInternalUrl(urlToParse, routingConfig.baseUrl)) {
		return {
			parsedUrl,
		}
	}

	const { relativeUrl, relativeEncodedUrl, relativePathnameParts } = getRelativeUrlData(
		urlToParse,
		routingConfig.baseUrl
	)
	const route = getRouteData(relativePathnameParts, routingConfig.routes, supportUrlHierarchy)

	return {
		...route,
		relativeUrl,
		relativeEncodedUrl,
		parsedUrl,
	}
}
