import type { AnimationsKit } from '@wix/animations-kit'
import type { AnimationsPageConfig, AnimatorManager, ScrollManager, ScrubSceneFactoryMap } from './types'
import type { IPropsStore } from '@wix/thunderbolt-symbols'
import { Scroll, ScrollScene } from 'fizban'
import { getNearestScrollRoot } from './utils'
import { getDisplayedId, getItemId, REPEATER_DELIMITER } from '@wix/thunderbolt-commons'

const CLEAR_PROPS = 'clip,clipPath,webkitClipPath,willChange,opacity,transform,transformOrigin,filter'
const clearParams = { props: CLEAR_PROPS, immediateRender: false }

const getElements = (ids: Array<string>): Array<HTMLElement> => {
	const elements = ids.map((id) => document.getElementById(id))
	return elements.filter((element) => element) as Array<HTMLElement>
}

const getElementsFromObj = (obj: Record<string, string>): Record<string, HTMLElement> =>
	Object.entries(obj).reduce((elements: Record<string, HTMLElement>, [key, id]) => {
		const element = document.getElementById(id)
		return element ? Object.assign(elements, { [key]: element }) : elements
	}, {})

export const getAnimatorManager = (
	animator: AnimationsKit,
	featureConfig?: AnimationsPageConfig,
	propsStore?: IPropsStore
): AnimatorManager => ({
	getAnimationProperties(animationName: string) {
		return animator.getProperties(animationName)
	},
	getAnimationApi(animationName: string) {
		return animator.getApiForAnimation(animationName)
	},
	kill(instance, seek) {
		animator.kill(instance, seek)
	},
	reverse(instance) {
		instance.reversed(!instance.reversed())
	},
	runAnimation({ name: animationName, targetId, duration = 0, delay = 0, animationSelectors = {}, params = {} }) {
		const targetIds = Array.isArray(targetId) ? targetId : [targetId]
		const elements = getElements(targetIds)
		const elementsForParams = getElementsFromObj(animationSelectors)
		return animator.animate(animationName, elements, duration, delay, { ...params, ...elementsForParams })
	},
	runTransition({ name: transitionName, srcId, targetId, duration = 0, delay = 0, params = {} }) {
		const srcIds = Array.isArray(srcId) ? srcId : [srcId]
		const targetIds = Array.isArray(targetId) ? targetId : [targetId]
		const srcElements = getElements(srcIds)
		const targetElements = getElements(targetIds)

		return animator.transition(transitionName, srcElements, targetElements, duration, delay, params)
	},
	runSequence(sequenceItems, params = {}) {
		const sequence = animator.sequence(params)

		sequenceItems.forEach((sequenceItem) =>
			sequenceItem.type === 'Animation'
				? sequence.add(this.runAnimation(sequenceItem.data))
				: sequence.add(this.runTransition(sequenceItem.data))
		)

		return sequence
	},
	animateTimeScale({ instance, duration, from, to, easing }, callbacks?) {
		animator.animateTimeScale(instance, duration, from, to, easing, callbacks)
	},
	runAnimationOnElements: animator.animate,
	createSequence: animator.sequence,
	createAnimationFromParams: animator.animate, // TODO: probably should replace runAnimationOnElements
	getScrubTargets(sourceId, targetId) {
		const parentRepeater = featureConfig && featureConfig.repeaterTemplateToParentMap[targetId]
		const { items = [] } = parentRepeater && propsStore ? propsStore.get(parentRepeater) : {}
		return items.length ? items.map((item: string) => getDisplayedId(targetId, item)) : [targetId]
	},
	createScrubAnimations(animations) {
		const scrubScenes: ScrubSceneFactoryMap = {}

		Object.entries(animations).forEach(([effectId, animation]) => {
			const { targetId: targetId_, startOffset, endOffset, namedEffect } = animation

			if (!namedEffect) {
				return
			}

			const { type, ...effectParams } = namedEffect

			let startOffsetAddition: string | undefined, endOffsetAddition: string | undefined
			const getScrubOffsets = this.getAnimationApi(type).getScrubOffsets
			if (getScrubOffsets) {
				const offsetAdditions = getScrubOffsets(effectParams)
				startOffsetAddition = offsetAdditions.start
				endOffsetAddition = offsetAdditions.end
			}

			scrubScenes[effectId] = {
				targetId: targetId_,
				factory: (targetId) => {
					const effect = this.runAnimation({
						name: type,
						delay: 0,
						duration: 1,
						targetId: targetId || targetId_,
						params: {
							...effectParams,
							startOffset,
							endOffset,
							paused: true,
						},
					})

					return {
						start: {
							name: startOffset!.name,
							offset: startOffset!.offset!.value,
							add: startOffsetAddition,
						},
						end: { name: endOffset!.name, offset: endOffset!.offset!.value, add: endOffsetAddition },
						effect: (__: any, p: number) => effect.progress(p),
					}
				},
			}
		})
		return scrubScenes
	},
	startScrubAnimations(triggers, scrubScenes) {
		const scrollRootsMap = new Map()
		const scrollManagers: Array<typeof Scroll> = []

		function addScroll(factory: (targetId?: string) => ScrollScene, source: HTMLElement, targetId: string) {
			const scene = factory(targetId)
			scene.viewSource = source
			const root = getNearestScrollRoot(scene.viewSource?.parentElement as HTMLElement | null)

			if (!scrollRootsMap.has(root)) {
				scrollRootsMap.set(root, [])
			}

			scrollRootsMap.get(root).push(scene)
		}

		Object.entries(triggers).forEach(([effectId, trigger]) => {
			if (trigger.trigger === 'view-progress') {
				const { factory, targetId } = scrubScenes[effectId]
				const triggerElement = document.getElementById(trigger.componentId) as HTMLElement

				if (triggerElement) {
					const targetIds = this.getScrubTargets(trigger.componentId, targetId)
					targetIds.forEach((target) => addScroll(factory, triggerElement, target))
				} else {
					//	probably the trigger element is a child of a Repeater
					const triggerElements = Array.from(
						document.querySelectorAll(`[id^="${trigger.componentId}${REPEATER_DELIMITER}"]`)
					)
					triggerElements.forEach((sourceElement: Element) => {
						// we only support animating inside same element of triggering Item with view-progress
						const target = getDisplayedId(targetId, getItemId(sourceElement.id))
						addScroll(factory, sourceElement as HTMLElement, target)
					})
				}
			}
		})

		scrollRootsMap.forEach((scenes, root) => {
			if (scenes.length) {
				const scrollManager = new Scroll({
					root,
					scenes,
					observeViewportEntry: false,
					observeViewportResize: false,
					observeSourcesResize: false,
				})
				scrollManager.start()

				scrollManagers.push(scrollManager)
			}
		})

		return scrollManagers
	},
	killPreviewScrubAnimations(scrollManagers: Array<ScrollManager>) {
		if (scrollManagers.length) {
			scrollManagers.forEach((manager) => manager.destroy())
			scrollManagers.length = 0
		}
	},
	clearPreviewScrubAnimations(idsToClear: Set<string>) {
		const baseClearData = {
			name: 'BaseClear',
			targetId: [...idsToClear],
			duration: 0,
			delay: 0,
			params: clearParams,
		}
		this.runSequence([{ type: 'Animation', data: baseClearData }])
	},
})
