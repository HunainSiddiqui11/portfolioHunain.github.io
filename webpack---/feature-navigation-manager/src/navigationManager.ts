import _ from 'lodash'
import { withDependencies, optional } from '@wix/thunderbolt-ioc'
import { createPromise } from '@wix/thunderbolt-commons'
import { isViewerFragmentSymbol } from '@wix/thunderbolt-symbols'
import type { INavigationManager, NavigationStartListener } from './types'

export const NavigationManager = withDependencies(
	[optional(isViewerFragmentSymbol)],
	(isViewerFragment: boolean): INavigationManager => {
		let isDuringNavigation = false
		let _shouldBlockRender = false
		let isFirstNavigation = !isViewerFragment // minisites flow should be initialized in a post navigation state. isFirstNavigation() should return false.
		let navigationEndResolvers: Array<() => void> = []
		let continueNavigationResolvers: Array<(isLast: boolean) => void> = []
		let dataFetchingResolvers: Array<() => void> = []
		let isDataFetching = false
		let navigationStartListeners: Array<NavigationStartListener> = []

		return {
			endNavigation: () => {
				isDuringNavigation = false
				isFirstNavigation = false
				continueNavigationResolvers.forEach((resolver, idx) =>
					resolver(idx === continueNavigationResolvers.length - 1)
				)
				continueNavigationResolvers = []
				navigationEndResolvers.forEach((resolver) => resolver())
				navigationEndResolvers = []
			},
			setShouldBlockRender: (shouldBlockRender: boolean) => {
				_shouldBlockRender = shouldBlockRender
			},
			isDuringNavigation: () => isDuringNavigation,
			shouldBlockRender: () => _shouldBlockRender,
			isFirstNavigation: () => isFirstNavigation,
			startNavigation: () => {
				isDuringNavigation = true
				navigationStartListeners.forEach((listener) => listener())
			},
			waitForShouldContinueNavigation: () => {
				// don't use this api - should be used only in router.ts, if you need to wait for navigation end use waitForNavigationEnd
				const { resolver, promise } = createPromise<boolean>()
				continueNavigationResolvers.push(resolver)
				return promise
			},
			waitForNavigationEnd: () => {
				const { resolver, promise } = createPromise()
				navigationEndResolvers.push(resolver)
				return promise
			},
			startDataFetching: () => {
				isDataFetching = true
			},
			endDataFetching: () => {
				isDataFetching = false
				dataFetchingResolvers.forEach((resolver) => resolver())
				dataFetchingResolvers = []
			},
			isDuringDataFetching: () => isDataFetching,
			waitForDataFetching: () => {
				const { resolver, promise } = createPromise()
				dataFetchingResolvers.push(resolver)
				return promise
			},
			registerToNavigationStart: (listener: () => void) => {
				navigationStartListeners.push(listener)
				return () => {
					navigationStartListeners = _.without(navigationStartListeners, listener)
				}
			},
		}
	}
)
