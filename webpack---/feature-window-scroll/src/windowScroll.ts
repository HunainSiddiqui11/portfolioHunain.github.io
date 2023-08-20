import { withDependencies, optional } from '@wix/thunderbolt-ioc'
import { isSSR } from '@wix/thunderbolt-commons'
import { AnimationCallbacks, Animations, IAnimations } from 'feature-animations'
import type { IResolvableReadyForScrollPromise, IWindowScrollAPI } from './types'
import { calcScrollDuration } from './scrollUtils'
import { BrowserWindowSymbol, Experiments, ExperimentsSymbol, ViewMode, ViewModeSym } from '@wix/thunderbolt-symbols'
import { LightboxUtilsSymbol, ILightboxUtils } from 'feature-lightbox'
import { ResolvableReadyForScrollPromiseSymbol } from './symbols'
import { ISiteScrollBlocker, SiteScrollBlockerSymbol } from 'feature-site-scroll-blocker'
import type { SequenceInstance } from '@wix/animations-kit'
import { isElementTabbable } from 'feature-cyclic-tabbing'

const getPosition = (elem: HTMLElement) => window.getComputedStyle(elem).getPropertyValue('position').toLowerCase()

const isElementOrAncestorFixed = (element: HTMLElement) => {
	let elem = element
	while (elem && elem !== window.document.body) {
		if (getPosition(elem) === 'fixed') {
			return true
		}
		elem = elem.offsetParent as HTMLElement
	}
	return false
}

const pxToNumber = (pxSize: string) => Number(pxSize.replace('px', ''))

const getCompClientYForScroll = (
	window: Window,
	compNode: HTMLElement,
	isScrollBlocked: boolean,
	openLightboxId: string | undefined
) => {
	const wixAdsElement = window.document.getElementById('WIX_ADS')
	const wixAdsHeight = wixAdsElement ? wixAdsElement.offsetHeight : 0

	const siteHeaderPlaceholderElement = window.document.getElementById('SITE_HEADER-placeholder')
	const siteHeaderPlaceholderHeight = siteHeaderPlaceholderElement ? siteHeaderPlaceholderElement.offsetHeight : 0

	let bodyTop = openLightboxId
		? window.document.getElementById(openLightboxId)!.getBoundingClientRect().top
		: window.document.body.getBoundingClientRect().top

	const compTop = compNode.getBoundingClientRect().top

	if (isScrollBlocked) {
		const siteContainerElement = window.document.getElementById('SITE_CONTAINER')
		bodyTop = siteContainerElement ? pxToNumber(window.getComputedStyle(siteContainerElement).marginTop) : 0
	}

	return compTop - bodyTop - wixAdsHeight - siteHeaderPlaceholderHeight
}

const getScrollableElement = (popupUtils?: ILightboxUtils) =>
	popupUtils?.getCurrentLightboxId() ? window.document.getElementById('POPUPS_ROOT')! : window

export const WindowScroll = withDependencies(
	[
		BrowserWindowSymbol,
		ViewModeSym,
		ResolvableReadyForScrollPromiseSymbol,
		SiteScrollBlockerSymbol,
		ExperimentsSymbol,
		optional(LightboxUtilsSymbol),
		optional(Animations),
	],
	(
		window: Window,
		viewMode: ViewMode,
		{ readyForScrollPromise }: IResolvableReadyForScrollPromise,
		siteScrollBlockerApi: ISiteScrollBlocker,
		experiments: Experiments,
		popupUtils?: ILightboxUtils,
		animations?: IAnimations
	): IWindowScrollAPI => {
		if (isSSR(window)) {
			return {
				scrollToComponent: () => Promise.resolve(),
				animatedScrollTo: () => Promise.resolve(),
			}
		}

		const animatedScrollTo = async (targetY: number, callbacks: AnimationCallbacks = {}): Promise<void> => {
			if (!animations) {
				return
			}
			const animationInstance = await animations.getInstance()
			await readyForScrollPromise
			const isMobile = viewMode === 'mobile'
			const easingName = isMobile ? 'Quint.easeOut' : 'Sine.easeInOut'
			const duration = calcScrollDuration(window.pageYOffset, targetY, isMobile)
			const scrollableElement = getScrollableElement(popupUtils)

			return new Promise((resolve) => {
				const mergedCallbacks = {
					...callbacks,
					onComplete: (instance: SequenceInstance) => {
						callbacks.onComplete?.(instance)
						resolve()
					},
				}
				animationInstance.runAnimationOnElements(
					'BaseScroll',
					[scrollableElement as HTMLElement],
					duration,
					0,
					{
						y: targetY,
						ease: easingName,
						callbacks: mergedCallbacks,
					}
				)
			})
		}

		const scrollToComponent = async (
			targetCompId: string,
			{ callbacks = {}, skipScrollAnimation = false } = {}
		) => {
			await readyForScrollPromise
			const targetElement = window.document.getElementById(targetCompId)!
			const openLightboxId = popupUtils?.getCurrentLightboxId()
			if (!targetElement || (isElementOrAncestorFixed(targetElement) && !openLightboxId)) {
				return
			}
			const compClientYForScroll = await new Promise<number>((resolve) => {
				window.requestAnimationFrame(() => {
					resolve(
						getCompClientYForScroll(
							window,
							targetElement,
							siteScrollBlockerApi.isScrollingBlocked(),
							openLightboxId
						)
					)
				})
			})
			if (skipScrollAnimation) {
				window.scrollTo({ top: 0 })
			} else {
				await animatedScrollTo(compClientYForScroll, callbacks)

				const compClientYForScrollAfterScroll = getCompClientYForScroll(
					window,
					targetElement,
					siteScrollBlockerApi.isScrollingBlocked(),
					openLightboxId
				)

				const isStickyElement = getPosition(targetElement) === 'sticky'
				const shouldRetryScroll = !isStickyElement && compClientYForScroll !== compClientYForScrollAfterScroll

				if (shouldRetryScroll) {
					// if the anchor original position changed due to dynamic
					// content above it height change pushing anchor down
					// we need to perform scroll logic again until reaching the anchor
					scrollToComponent(targetCompId, { callbacks, skipScrollAnimation })
				}
			}

			if (!isElementTabbable(targetElement)) {
				targetElement.setAttribute('tabIndex', '-1')
			}
			targetElement.focus({ preventScroll: true })
		}

		return {
			animatedScrollTo,
			scrollToComponent,
		}
	}
)
