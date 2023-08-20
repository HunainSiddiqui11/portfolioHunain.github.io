import { BootstrapData } from '../../types'

const STORES_PRODUCT_PAGE_APP_DEF_ID = 'a0c68605-c2e7-4c8d-9ea1-767f9770e087'
const EXPORT_UPDATE_CONFIG_WHITELIST = ['b278a256-2757-4f19-9313-c05c783bec92', 'f6c56c59-bf78-414c-9b3a-bb0435372da0']
const EXPORT_UPDATE_CONFIG_BLACKLIST = ['cffc6740-8042-48cc-a35b-d3fd03a69f0c', 'd90652a2-f5a1-4c7c-84c4-d4cdcc41f130', '1522827f-c56c-a5c9-2ac9-00f9e6ae12d3', '3e950e28-b054-4df6-ad7b-9e28ffc5072e'] // staff members, portfolio, pricing plans, appointment field

const isInWhitelist = (appDefinitionId: string) => EXPORT_UPDATE_CONFIG_WHITELIST.includes(appDefinitionId)
const isInBlacklist = (appDefinitionId: string) => EXPORT_UPDATE_CONFIG_BLACKLIST.includes(appDefinitionId)

export default ({ platformEnvData }: BootstrapData) => {
	if (platformEnvData.site.experiments['specs.thunderbolt.blocksAddStoresAppDefIdToUpdateConfigWhitelist']) {
		EXPORT_UPDATE_CONFIG_WHITELIST.push(STORES_PRODUCT_PAGE_APP_DEF_ID)
	}
	return {
		enabled(appDefinitionId: string) {
			if (!platformEnvData.site.experiments['specs.thunderbolt.blocksInvokePropsChangedOnUpdateConfig'] || isInBlacklist(appDefinitionId)) {
				return false
			}
			if (Boolean(platformEnvData.site.experiments['specs.thunderbolt.blocksUpdateConfigAll']) || isInWhitelist(appDefinitionId)) {
				return true
			}
			return false
		},
	}
}
