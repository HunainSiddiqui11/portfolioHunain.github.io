import type { ContainerModuleLoader } from '@wix/thunderbolt-ioc'
import { LifeCycle, RendererPropsExtenderSym, Translate } from '@wix/thunderbolt-symbols'
import { TranslationsImpl, TranslateBinder, CorruptedTranslationsBI } from './translations'

export const site: ContainerModuleLoader = (bind) => {
	bind(Translate).to(TranslationsImpl)
	bind(RendererPropsExtenderSym).to(TranslateBinder)
}

export const page: ContainerModuleLoader = (bind) => {
	bind(LifeCycle.PageDidMountHandler).to(CorruptedTranslationsBI)
}
