import { PageFeatureConfigSymbol, Props, ViewMode } from '@wix/thunderbolt-symbols'
import { TweenEngine, AnimationsKit } from '@wix/animations-kit'
import gsap from 'gsap'
import ScrollToPlugin from 'gsap/ScrollToPlugin'
import { named, withDependencies } from '@wix/thunderbolt-ioc'
import { name } from './symbols'
import { getAnimatorManager } from './animations'

export const CreateAnimatorManager = withDependencies(
	[named(PageFeatureConfigSymbol, name), Props],
	(featureConfig, propsStore) => (viewMode: ViewMode | 'motion') => {
		const isMotion = viewMode === 'motion'
		const animationViewMode = isMotion ? undefined : viewMode
		const plugins = isMotion ? [] : [ScrollToPlugin]
		const { engine } = new TweenEngine(gsap, plugins)
		const animator = new AnimationsKit(engine, undefined, animationViewMode, isMotion)

		return getAnimatorManager(animator, featureConfig, propsStore)
	}
)
