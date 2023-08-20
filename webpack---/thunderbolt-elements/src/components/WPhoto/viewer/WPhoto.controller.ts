import { withCompController } from '@wix/editor-elements-integrations';
import {
  AnalyticsClicksGroups,
  tryReportAnalyticsClicksBi,
} from '@wix/editor-elements-common-utils';
import type {
  IWPhotoProps,
  IWPhotoControllerProps,
  IWPhotoStateValues,
  IWPhotoMapperProps,
} from '../WPhoto.types';

export default withCompController<
  IWPhotoMapperProps,
  IWPhotoControllerProps,
  IWPhotoProps,
  IWPhotoStateValues
>(({ controllerUtils, mapperProps, stateValues }) => {
  const { reportBi, pageId } = stateValues;
  const {
    compId,
    language,
    pagesMap,
    mainPageId,
    fullNameCompType,
    trackClicksAnalytics,
    ...restMapperProps
  } = mapperProps;

  const reportBiOnClick: IWPhotoControllerProps['reportBiOnClick'] = () => {
    const { link, title, uri } = restMapperProps;

    tryReportAnalyticsClicksBi(reportBi, {
      link,
      language,
      trackClicksAnalytics,
      details: { uri },
      element_id: compId,
      elementTitle: title,
      elementType: fullNameCompType,
      elementGroup: AnalyticsClicksGroups.Image,
      pagesMetadata: { pagesMap, pageId, mainPageId },
    });
  };

  return {
    ...restMapperProps,
    reportBiOnClick,
    onSizeChange: (width, height) => {
      controllerUtils.updateProps({ width, height });
    },
  };
});
