import {
    AnalyticsPromoteEndpoint,
    AnalyticsPromoteSrc,
    ElementsClick,
} from './consts';
export const checkLightboxLink = (link) => 'linkPopupId' in link;
export const checkIsTopBottomLink = (link) => 'anchorDataId' in link &&
    (link.anchorDataId === 'SCROLL_TO_TOP' ||
        link.anchorDataId === 'SCROLL_TO_BOTTOM');
export const extractPageLinkId = (link, metadata) => {
    if (checkLightboxLink(link)) {
        return link.linkPopupId;
    } else {
        const pageUrl = new URL(link.href ? ? '');
        const entries = metadata ? .pagesMap && Object.entries(metadata ? .pagesMap);
        let entry = entries ? .find(([pageUriSEO]) => pageUrl.pathname ? .includes(pageUriSEO));
        // empty page in pathname - find main page entry
        if (!entry) {
            entry = entries ? .find(([, {
                id
            }]) => id === metadata ? .mainPageId);
        }
        return entry ? .[1].id;
    }
};
export const extractAnalyticsClicksActionName = (link) => {
    if (link === undefined) {
        return undefined;
    }
    return link === null ? 'None' : link.type;
};
export const createAnalyticsClicksCommonParams = () => ({
    bl: navigator.language,
    url: window.location.href,
});
export const createAnalyticsClicksDetails = (link, metadata) => {
    if (!link ? .type) {
        return undefined;
    }
    const {
        type
    } = link;
    switch (type) {
        case 'AnchorLink':
            return !checkIsTopBottomLink(link) ?
                {
                    id: link.anchorDataId
                } :
                undefined;
        case 'DocumentLink':
            return {
                id: link.docInfo ? .docId
            };
        case 'PageLink':
            return {
                id: extractPageLinkId(link, metadata),
                isLightbox: checkLightboxLink(link),
            };
        default:
            return undefined;
    }
};
export const createAnalyticsClicksValue = (link, metadata) => {
    if (!link ? .type) {
        return undefined;
    }
    const {
        type
    } = link;
    switch (type) {
        case 'AnchorLink':
            return link.anchorDataId;
        case 'DocumentLink':
            return link.docInfo ? .name;
        case 'PageLink':
            const checkId = extractPageLinkId(link, metadata);
            return Object.values(metadata ? .pagesMap ? ? {}).find(({
                id
            }) => id === checkId) ? .title;
        default:
            return link.href;
    }
};
export const tryReportAnalyticsClicksBi = (reportBi, params, context) => {
    const {
        link,
        value,
        details,
        actionName,
        elementType,
        pagesMetadata,
        trackClicksAnalytics,
        ...restParams
    } = params;
    if (!trackClicksAnalytics) {
        return;
    }
    const linkDetails = createAnalyticsClicksDetails(link, pagesMetadata);
    const biParamsDetails = details || linkDetails ?
        JSON.stringify({ ...linkDetails,
            ...details
        }) :
        undefined;
    const biParams = {
        ...restParams,
        ...createAnalyticsClicksCommonParams(),
        details: biParamsDetails,
        elementType: elementType ? ? 'Unknown',
        actionName: actionName ? ? extractAnalyticsClicksActionName(link),
        value: value ? ? createAnalyticsClicksValue(link, pagesMetadata),
    };
    reportBi({
        src: AnalyticsPromoteSrc,
        evid: ElementsClick,
        ...biParams
    }, {
        endpoint: AnalyticsPromoteEndpoint,
        ...context
    });
};
//# sourceMappingURL=utils.js.map