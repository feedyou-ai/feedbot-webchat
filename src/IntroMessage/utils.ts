import { getMinutesBetweenTimestamps } from '../utils/getMinutesBetweenTimestamps'

export const setPopupMessageCloseTimestamp = () => {
	if (!localStorage) {
		return
	}
	 
	localStorage.popupMessageCloseTimestamp = Date.now()
}

export const getPopupMessageCloseTimestamp = () => {
	if (!localStorage || !localStorage.popupMessageCloseTimestamp) {
		return false
	}
	
	return localStorage.popupMessageCloseTimestamp
}

export const wasPopupMessageRecentlyClosed = () => {
	const closedTimestamp = getPopupMessageCloseTimestamp()
	
	if(!closedTimestamp) {
		return false
	}
	
	const minutesSinceClosed = getMinutesBetweenTimestamps(Number(closedTimestamp), Date.now())
	const MINUTES_IN_A_DAY = 60 * 24
	
	if (minutesSinceClosed <= MINUTES_IN_A_DAY) {
		return true
	}
	
	return false
}