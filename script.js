/**
 * changeTabInterval in seconds
 * refreshInterval in minutes
 */

const TAB_TYPE = {
    REDASH: 0
}

const config = {
    changeTabInterval: 15,
    urls: [
        { type: TAB_TYPE.REDASH, nextUpdate: undefined, refreshInterval: 30, url: "https://redash.dev/dashboard/meudash?fullscreen" },
    ]
}

const state = {
    currentTabIndex: 0,
    tabCount: 0,
    tabs: [],
    refreshIntervalObj: undefined,
}

const openTabs = () => {
    const urls = config.urls;
    let index = 0;

    urls.map(item => createTab(index++, item.url));

    state.currentTabIndex = index;
    state.tabCount = index;
}

const createTab = (position, url) => {
    chrome.tabs.create({
        index: position,
        url,
        pinned: true
    },
        (tab) => state.tabs.push(tab)
    );
}

const refreshDashboard = (index) => {
    const tab = state.tabs[index];
    const dashboard = config.urls[index];
    const currentTime = new Date();
    const seconds = dashboard.refreshInterval * 60 * 1000;
    const nextUpdate = new Date(currentTime.getTime() + seconds);

    if (dashboard.type === TAB_TYPE.REDASH) {
        if (!dashboard.nextUpdate || dashboard.nextUpdate <= currentTime) {
            chrome.tabs.executeScript(tab.id, {
                code: "document.getElementById('split-button').click();"
            });
            config.urls[index].nextUpdate = nextUpdate;
        }
    }
}

const activeTab = (index) => {
    const tab = state.tabs[index];
    chrome.tabs.update(tab.id, { active: true }, (tab) => { console.log('current tab => ', tab.title); });
}

const activeTabsByInterval = () => {
    state.refreshIntervalObj = setInterval(
        () => {
            if (state.tabCount <= 1) {
                clearInterval(state.refreshIntervalObj);
                console.info('Less then 2 tab open. Refresh stopped.');
                return;
            }

            const nextTab = state.currentTabIndex + 1;
            state.currentTabIndex = nextTab >= state.tabCount ? 0 : nextTab;

            activeTab(state.currentTabIndex);
            refreshDashboard(state.currentTabIndex);
        }, (config.changeTabInterval * 1000)
    );
}

const process = () => {
    openTabs();
    activeTabsByInterval();

    chrome.tabs.onRemoved.addListener((tabid) => {
        state.tabs = state.tabs.filter(tab => tab.id !== tabid);
        state.tabCount = state.tabs.length;
    })
}

console.log('Extension loaded!');

setTimeout(function () {
    process();
}, 200);
