import {
  IPlatformData,
  withCompController,
} from '@wix/editor-elements-integrations';
import {
  AnalyticsClicksGroups,
  tryReportAnalyticsClicksBi,
} from '@wix/editor-elements-common-utils';
import {
  ISiteButtonMapperProps,
  ISiteButtonControllerProps,
  ISiteButtonProps,
  ISiteButtonStateValues,
} from '../SiteButton.types';

const useComponentProps = ({
  mapperProps,
  stateValues,
}: IPlatformData<
  ISiteButtonMapperProps,
  ISiteButtonControllerProps,
  ISiteButtonStateValues
>): ISiteButtonProps => {
  const {
    trackClicksAnalytics,
    compId,
    language,
    pagesMap,
    mainPageId,
    ...restMapperProps
  } = mapperProps;

  const reportBiOnClick: ISiteButtonProps['onClick'] = event => {
    const { fullNameCompType, label, link, isDisabled } = restMapperProps;
    const { reportBi, pageId } = stateValues;

    tryReportAnalyticsClicksBi(reportBi, {
      link,
      language,
      trackClicksAnalytics,
      elementTitle: label,
      elementType: fullNameCompType,
      elementGroup: AnalyticsClicksGroups.Button,
      details: { isDisabled: isDisabled ?? false },
      element_id: compId ?? event.currentTarget.id,
      pagesMetadata: { pagesMap, pageId, mainPageId },
    });
  };

  return {
    ...restMapperProps,
    reportBiOnClick,
  };
};

export default withCompController(useComponentProps);
