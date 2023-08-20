import { withDependencies } from '@wix/thunderbolt-ioc'
import {
	BrowserWindow,
	BrowserWindowSymbol,
	IPageDidMountHandler,
	ViewerModel,
	ViewerModelSym,
} from '@wix/thunderbolt-symbols'
import { OnLinkClick } from './symbols'
import { IOnLinkClickHandler } from './types'

const clickHandlerRegistrarFactory = (
	browserWindow: NonNullable<BrowserWindow>,
	{ onLinkClick }: IOnLinkClickHandler,
	viewerModel: ViewerModel
): IPageDidMountHandler => {
	return {
		pageDidMount: () => {
			browserWindow.addEventListener('click', onLinkClick)
			if (viewerModel.mode.debug && viewerModel.experiments['specs.thunderbolt.react_experimental']) {
				// for some reason react 18 strict mode doesn't fire click events on window
				Array.from(document.querySelectorAll('a')).map((e) => e.addEventListener('click', onLinkClick))
			}

			return () => {
				browserWindow.removeEventListener('click', onLinkClick)
			}
		},
	}
}

export const ClickHandlerRegistrar = withDependencies(
	[BrowserWindowSymbol, OnLinkClick, ViewerModelSym],
	clickHandlerRegistrarFactory
)
