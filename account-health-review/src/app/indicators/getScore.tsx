import {
    monitoredEntitiesClient,
    settingsObjectsClient,
    metricsClient,
    monitoredEntitiesCustomTagsClient,
    activeGatesClient
  } from '@dynatrace-sdk/client-classic-environment-v2';
  import { rumUserSessionsClient } from "@dynatrace-sdk/client-classic-environment-v1";
  
  import { documentsClient } from '@dynatrace-sdk/client-document';
  
  const scope = "Tenant"

  // Function to add warnings to the We app name if that's the default catch-all app
  function filterEntry(el) {
    const filteredEntry = {};
    filteredEntry["Monitored apps:"] = el.displayName === "My web application" ? "⚠️ My web application ⚠️" : el.displayName;
    return filteredEntry;
  }
  
  // Helper function to filter unique names
  function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
  }
  
  // Function to get the weight of a specific indicator
  async function getWeightedScore(indicator) {
    const score = await indicator();
    const weightedScore = score * indicatorWeights[indicator.name];
    return weightedScore;
  }
  
  // Function to get the maximum total score expected for a selection of indicators
  function getMaxWeightedTotalScore(indicators) {
    let maxWeightedTotalScore = 0;
    for(let indicator of indicators) {
      maxWeightedTotalScore += indicatorWeights[indicator.name]
    }
    return maxWeightedTotalScore;
  }
  
  // Each indicator can have a weight of 1, 2 or 3 for "Important", "Best practice" or "Fundamental" levels of importance
  const indicatorWeights = {
    fullStackCoverage: 3,
    candidates: 2,
    hostGroups: 2,
    hostGroupCoverage: 3,
    uniqueProcessGroups: 2,
    declarativeProcessGroupings: 1,
    uniqueServices: 2,
    customServices: 1,
    osServices: 2,
    serviceKeyRequests: 2,
    calculatedServiceMetrics: 2,
    webApps: 2,
    androidApps: 2,
    iosApps: 2,
    userTagCoverage: 2,
    uscm: 2,
    syntheticMonitors: 3,
    managementZones: 3,
    autoTags: 2,
    manualTags: 1,
    alertingProfiles: 2,
    integrations: 2,
    integrationTypes: 2,
    metricEvents: 2,
    slos: 2,
    releaseIntegrations: 1,
    logMonitoring: 2,
    thirdPartyVulnerabilityAnalytics: 2,
    codeLevelVulnerabilityAnalytics: 2,
    runtimeApplicationProtection: 2,
    dashboards: 1,
    notebooks: 1,
    cloudIntegrations: 2,
    extensions: 1,
    extensionConfigurations: 1,
    networkZones: 1,
    ownershipTeams: 2,
    auditLogs: 1,
    oneAgentVersions: 2,
    activeGateVersions: 2
  }
  
  // List indicators that can be evaluated in a tenant scope
  const tenantIndicators = [
    fullStackCoverage,
    candidates,
    hostGroups,
    hostGroupCoverage,
    uniqueProcessGroups,
    declarativeProcessGroupings,
    uniqueServices,
    customServices,
    osServices,
    serviceKeyRequests,
    calculatedServiceMetrics,
    webApps,
    androidApps,
    iosApps,
    userTagCoverage,
    uscm,
    syntheticMonitors,
    managementZones,
    autoTags,
    manualTags,
    alertingProfiles,
    integrations,
    integrationTypes,
    metricEvents,
    slos,
    releaseIntegrations,
    logMonitoring,
    thirdPartyVulnerabilityAnalytics,
    codeLevelVulnerabilityAnalytics,
    runtimeApplicationProtection,
    dashboards,
    notebooks,
    cloudIntegrations,
    extensions,
    extensionConfigurations,
    networkZones,
    ownershipTeams,
    auditLogs,
    oneAgentVersions,
    activeGateVersions
  ];
  
  
  // Find below an async function that returns the local score (1, 0.5 or 0) for each indicator
  async function fullStackCoverage() {
    // Define entity selector based on the selected scope
    let entitySelector;

    entitySelector = 'type("HOST"),monitoringMode("FULL_STACK")';
    let config = { from: "now-30d", entitySelector: entitySelector};
    const fullStackHosts = await monitoredEntitiesClient.getEntities(config);

    entitySelector = 'type("HOST"),isMonitoringCandidate(false)';
    config = { from: "now-30d", entitySelector: entitySelector};
    const monitoredHosts = await monitoredEntitiesClient.getEntities(config);

    const fullStackCoverage = Math.round(fullStackHosts.totalCount/monitoredHosts.totalCount*100);
    const score = fullStackCoverage === 100 ? 1 : (fullStackCoverage >= 80 ? 0.5 : 0);
    return score;
  }
  
  async function candidates() {
    let config = { from: `now-30d`, entitySelector: 'type("HOST"),isMonitoringCandidate(false)'};
    const monitoredHosts = await monitoredEntitiesClient.getEntities(config);

    config = { from: `now-30d`, entitySelector: 'type("HOST"),isMonitoringCandidate(true)'};
    const monitoringCandidates = await monitoredEntitiesClient.getEntities(config);

    const score = monitoringCandidates.totalCount === 0 ? 1 : (monitoringCandidates.totalCount < 50 ? 0.5 : 0);
    return score;
  }
  
  async function hostGroups() {
    // Define entity selector based on the selected scope
    let entitySelector;

    entitySelector = 'type("HOST_GROUP")';
    let config = { from: `now-30d`, entitySelector: entitySelector};
    const hostGroups = await monitoredEntitiesClient.getEntities(config);

    entitySelector = 'type("APPLICATION")';
    config = { from: `now-30d`, entitySelector: entitySelector};
    const webApps = await monitoredEntitiesClient.getEntities(config);

    entitySelector = 'type("MOBILE_APPLICATION")';
    config = { from: `now-30d`, entitySelector: entitySelector};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);

    entitySelector = 'type("CUSTOM_APPLICATION")';
    config = { from: `now-30d`, entitySelector: entitySelector};
    const customApps = await monitoredEntitiesClient.getEntities(config);

    const hostGroupAppRatio = hostGroups.totalCount/(webApps.totalCount + mobileApps.totalCount + customApps.totalCount);
    const score = hostGroupAppRatio >= 1 ? 1 : (hostGroupAppRatio >= 0.8 ? 0.5 : 0);
    return score;
  }
  
  async function hostGroupCoverage() {
    // Define entity selector based on the selected scope
    let entitySelector;

    entitySelector = 'type("HOST"),isMonitoringCandidate(false)';
    let config = { from: `now-30d`, entitySelector: entitySelector};
    const monitoredHosts = await monitoredEntitiesClient.getEntities(config);

    entitySelector = 'type("HOST"),isMonitoringCandidate(false),fromRelationships.isInstanceOf(type("HOST_GROUP"))';
    config = { from: `now-30d`, entitySelector: entitySelector};
    const hostsWithHostGroup = await monitoredEntitiesClient.getEntities(config);

    const hostGroupCoverage = Math.round(hostsWithHostGroup.totalCount/monitoredHosts.totalCount*100);
    const score = hostGroupCoverage === 100 ? 1 : (hostGroupCoverage >= 80 ? 0.5 : 0);
    return score;
  }
  
  
  async function uniqueProcessGroups() {
    // Define entity selector based on the selected scope
    let entitySelector;

    entitySelector = 'type("PROCESS_GROUP")';
    let config = { from: "now-30d", entitySelector: entitySelector, pageSize: 12000};
    let objects = await monitoredEntitiesClient.getEntities(config);
    const processGroupsCount = objects.totalCount;
    let processGroups = objects.entities;
    while(objects.nextPageKey) {
      let config2 = { nextPageKey: objects.nextPageKey };
      objects = await monitoredEntitiesClient.getEntities(config2);
      if (processGroups && objects.entities){
        processGroups = [...processGroups, ...objects.entities];
      }
    }

    if (processGroups){
      const lookup = processGroups.reduce((a, e) => {
        if (e.displayName){
          a[e.displayName] = ++a[e.displayName] || 0;
        }
        return a;
      }, {});
      if (e.displayName){
        const duplicates = processGroups.filter(e => lookup[e.displayName]);
      }
    const uniqueProcessGroupRatio = 100 - parseInt(duplicates.length / processGroupsCount * 100);
    }
    const score = uniqueProcessGroupRatio === 100 ? 1 : (uniqueProcessGroupRatio >= 95 ? 0.5 : 0);
    return score;
  }
  

  async function declarativeProcessGroupings() {
    let config = { schemaIds: 'builtin:declarativegrouping'};
    const declarativeGroupings = await settingsObjectsClient.getSettingsObjects(config);
    let config2 = { from: `now-30d`, entitySelector: 'type("PROCESS_GROUP")'};
    const processGroups = await monitoredEntitiesClient.getEntities(config2);
    const declarativeGroupingRatio = declarativeGroupings.totalCount / processGroups.totalCount;
    const score = declarativeGroupingRatio > 0.0001 ? 1 : 0;
    return score;
  }
  
  async function uniqueServices() {
    let scope;
    if($Scope[0] === "Tenant") {
      scope = 'Tenant';
    } else {
      let mzList = "";
      for(let i=0; i<$Scope.length; i++) {
        mzList += i === 0 ? `"${$Scope[i]}"` : `,"${$Scope[i]}"`;
      }
      scope = mzList;
    }
    // Define entity selector based on the selected scope
    let entitySelector;
    if(scope === "Tenant") {
      entitySelector = 'type("SERVICE")';
    } else {
      entitySelector = `type("SERVICE"),mzName(${scope})`;
    }
    let config = { from: "now-1d", entitySelector: entitySelector, pageSize: 12000 };
    let objects = await monitoredEntitiesClient.getEntities(config);
    const servicesCount = objects.totalCount;
    let services = objects.entities;
    while(objects.nextPageKey) {
      config = { nextPageKey: objects.nextPageKey };
      objects = await monitoredEntitiesClient.getEntities(config);
      services = [...services, ...objects.entities];
    }
    const lookup = services.reduce((a, e) => {
      a[e.displayName] = ++a[e.displayName] || 0;
      return a;
    }, {});
    const duplicates = services.filter(e => lookup[e.displayName]);
    const uniqueServiceRatio = 100 - parseInt(duplicates.length / servicesCount * 100);
    const score = uniqueServiceRatio === 100 ? 1 : (uniqueServiceRatio >= 95 ? 0.5 : 0);
    return score;
  }
  
  async function customServices() {
    let scope;
    if($Scope[0] === "Tenant") {
      scope = 'Tenant';
    } else {
      let mzList = "";
      for(let i=0; i<$Scope.length; i++) {
        mzList += i === 0 ? `"${$Scope[i]}"` : `,"${$Scope[i]}"`;
      }
      scope = mzList;
    }
    // Define entity selector based on the selected scope
    let entitySelector;
    if(scope === "Tenant") {
      entitySelector = 'type("SERVICE")';
    } else {
      entitySelector = `type("SERVICE"),mzName(${scope})`;
    }
    let config = { from: "now-1d", entitySelector: entitySelector};
    const services = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("SERVICE"),serviceType("CUSTOM_SERVICE")';
    } else {
      entitySelector = `type("SERVICE"),serviceType("CUSTOM_SERVICE"),mzName(${scope})`;
    }
    config = { from: "now-1d", entitySelector: entitySelector};
    const customServices = await monitoredEntitiesClient.getEntities(config);
    const customServiceRatio = customServices.totalCount / services.totalCount;
    const score = customServiceRatio > 0.01 ? 1 : (customServiceRatio >= 0.001 ? 0.5 : 0);
    return score;
  }
  
  async function osServices() {
    let config = { schemaIds: 'builtin:os-services-monitoring'};
    const objects = await settingsObjectsClient.getSettingsObjects(config);
    const osServicesAlertingRules = objects.items.filter(el => el.value.enabled);
    const score = osServicesAlertingRules.length > 1 ? 1 : (osServicesAlertingRules.length === 1 ? 0.5 : 0);
    return score;
  }
  
  async function serviceKeyRequests() {
    let scope;
    if($Scope[0] === "Tenant") {
      scope = 'Tenant';
    } else {
      let mzList = "";
      for(let i=0; i<$Scope.length; i++) {
        mzList += i === 0 ? `"${$Scope[i]}"` : `,"${$Scope[i]}"`;
      }
      scope = mzList;
    }
    // Define entity selector based on the selected scope
    let entitySelector;
    if(scope === "Tenant") {
      entitySelector = 'type("SERVICE_METHOD"),fromRelationships.isServiceMethodOfService(type("SERVICE"))';
    } else {
      entitySelector = `type("SERVICE_METHOD"),fromRelationships.isServiceMethodOfService(type("SERVICE")),mzName(${scope})`;
    }
    let config = { from: "now-1d", entitySelector: entitySelector};
    let objects = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("APPLICATION")';
    } else {
      entitySelector = `type("APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const webApps = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("MOBILE_APPLICATION")';
    } else {
      entitySelector = `type("MOBILE_APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("CUSTOM_APPLICATION")';
    } else {
      entitySelector = `type("CUSTOM_APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const customApps = await monitoredEntitiesClient.getEntities(config);
    const monitoredApps = webApps.totalCount + mobileApps.totalCount + customApps.totalCount;
    const serviceKeyRequestRatio = objects.totalCount / monitoredApps;
    const score = (serviceKeyRequestRatio >= 3) ? 1 : (serviceKeyRequestRatio >= 1 ? 0.5 : 0);
    return score;
  }
  
  async function calculatedServiceMetrics() {
    let config = { acceptType: "application/json; charset=utf-8", text: "calc:service" };
    let objects = await metricsClient.allMetrics(config);
    config = { from: "now-7d", entitySelector: 'type("APPLICATION")'};
    const webApps = await monitoredEntitiesClient.getEntities(config);
    config = { from: "now-7d", entitySelector: 'type("MOBILE_APPLICATION")'};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);
    config = { from: "now-7d", entitySelector: 'type("CUSTOM_APPLICATION")'};
    const customApps = await monitoredEntitiesClient.getEntities(config);
    const monitoredApps = webApps.totalCount + mobileApps.totalCount + customApps.totalCount;
    const scmRatio = objects.totalCount / monitoredApps;
    const score = scmRatio >= 3 ? 1 : (scmRatio >= 1 ? 0.5 : 0);
    return score;
  }
  
  async function webApps() {
    let scope;
    if($Scope[0] === "Tenant") {
      scope = 'Tenant';
    } else {
      let mzList = "";
      for(let i=0; i<$Scope.length; i++) {
        mzList += i === 0 ? `"${$Scope[i]}"` : `,"${$Scope[i]}"`;
      }
      scope = mzList;
    }
    // Define entity selector based on the selected scope
    let entitySelector;
    if(scope === "Tenant") {
      entitySelector = 'type("APPLICATION")';
    } else {
      entitySelector = `type("APPLICATION"),mzName(${scope})`;
    }
    const config = { from: `now-7d`, entitySelector: entitySelector};
    const objects = await monitoredEntitiesClient.getEntities(config);
    const score = (objects.entities.some(el => el.displayName === "My web application") || objects.totalCount === 0) ? 0 : 1;
    return score;
  }
  
  async function androidApps() {
    let scope;
    if($Scope[0] === "Tenant") {
      scope = 'Tenant';
    } else {
      let mzList = "";
      for(let i=0; i<$Scope.length; i++) {
        mzList += i === 0 ? `"${$Scope[i]}"` : `,"${$Scope[i]}"`;
      }
      scope = mzList;
    }
    // Define entity selector based on the selected scope
    let entitySelector;
    if(scope === "Tenant") {
      entitySelector = 'type("APPLICATION")';
    } else {
      entitySelector = `type("APPLICATION"),mzName(${scope})`;
    }
    let config = { from: `now-7d`, entitySelector: entitySelector};
    const webApps = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("MOBILE_APPLICATION")';
    } else {
      entitySelector = `type("MOBILE_APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("CUSTOM_APPLICATION")';
    } else {
      entitySelector = `type("CUSTOM_APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const customApps = await monitoredEntitiesClient.getEntities(config);
    const apps = webApps.totalCount + mobileApps.totalCount + customApps.totalCount;
    if(scope === "Tenant") {
      entitySelector = 'type("MOBILE_APPLICATION"),mobileOsFamily("ANDROID")';
    } else {
      entitySelector = `type("MOBILE_APPLICATION"),mobileOsFamily("ANDROID"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const androidApps = await monitoredEntitiesClient.getEntities(config);
    const androidAppRatio = androidApps.totalCount / apps;
    const score = androidAppRatio >= 0.05 ? 1 : 0;
    return score;
  }
  
  async function iosApps() {
    let scope;
    if($Scope[0] === "Tenant") {
      scope = 'Tenant';
    } else {
      let mzList = "";
      for(let i=0; i<$Scope.length; i++) {
        mzList += i === 0 ? `"${$Scope[i]}"` : `,"${$Scope[i]}"`;
      }
      scope = mzList;
    }
    // Define entity selector based on the selected scope
    let entitySelector;
    if(scope === "Tenant") {
      entitySelector = 'type("APPLICATION")';
    } else {
      entitySelector = `type("APPLICATION"),mzName(${scope})`;
    }
    let config = { from: `now-7d`, entitySelector: entitySelector};
    const webApps = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("MOBILE_APPLICATION")';
    } else {
      entitySelector = `type("MOBILE_APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("CUSTOM_APPLICATION")';
    } else {
      entitySelector = `type("CUSTOM_APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const customApps = await monitoredEntitiesClient.getEntities(config);
    const apps = webApps.totalCount + mobileApps.totalCount + customApps.totalCount;
    if(scope === "Tenant") {
      entitySelector = 'type("MOBILE_APPLICATION"),mobileOsFamily("IOS")';
    } else {
      entitySelector = `type("MOBILE_APPLICATION"),mobileOsFamily("IOS"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const iosApps = await monitoredEntitiesClient.getEntities(config);
    const iosAppRatio = iosApps.totalCount / apps;
    const score = iosAppRatio >= 0.05 ? 1 : 0;
    return score;
  }
  
  async function userTagCoverage() {
    // Get user tagged apps
    let userTaggedApps = await rumUserSessionsClient.getUsqlResultAsTable({
      query: "SELECT application FROM useraction WHERE (usersession.userId IS NOT NULL) GROUP BY application LIMIT 500",
      startTimestamp: (Date.now() - 7*24*60*60*1000),
      pageSize: 500
    });
    // Get all apps
    let config = { from: "now-7d", entitySelector: 'type("APPLICATION")'};
    const webApps = await monitoredEntitiesClient.getEntities(config);
    config = { from: "now-7d", entitySelector: 'type("MOBILE_APPLICATION")'};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);
    config = { from: "now-7d", entitySelector: 'type("CUSTOM_APPLICATION")'};
    const customApps = await monitoredEntitiesClient.getEntities(config);
    const monitoredApps = webApps.totalCount + mobileApps.totalCount + customApps.totalCount;
    // compute user tag coverage
    const userTaggedAppCoverage = parseInt((userTaggedApps.values.length / monitoredApps)*100);      
    // Compute local score based on above number
    const score = userTaggedAppCoverage >= 95 ? 1 : (userTaggedAppCoverage >= 80 ? 0.5 : 0);
    return score;
  }
  
  async function uscm() {
    let config = { acceptType: "application/json; charset=utf-8", text: "uscm." };
    let objects = await metricsClient.allMetrics(config);
    config = { from: "now-7d", entitySelector: 'type("APPLICATION")'};
    const webApps = await monitoredEntitiesClient.getEntities(config);
    config = { from: "now-7d", entitySelector: 'type("MOBILE_APPLICATION")'};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);
    config = { from: "now-7d", entitySelector: 'type("CUSTOM_APPLICATION")'};
    const customApps = await monitoredEntitiesClient.getEntities(config);
    const monitoredApps = webApps.totalCount + mobileApps.totalCount + customApps.totalCount;
    const uscmRatio = objects.totalCount / monitoredApps;
    const score = uscmRatio >= 3 ? 1 : (uscmRatio >= 1 ? 0.5 : 0);
    return score;
  }
  
  async function syntheticMonitors() {
    // List all synthetic monitors
    let scope;
    if($Scope[0] === "Tenant") {
      scope = 'Tenant';
    } else {
      let mzList = "";
      for(let i=0; i<$Scope.length; i++) {
        mzList += i === 0 ? `"${$Scope[i]}"` : `,"${$Scope[i]}"`;
      }
      scope = mzList;
    }
    // Define entity selector based on the selected scope
    let entitySelector;
    if(scope === "Tenant") {
      entitySelector = 'type("SYNTHETIC_TEST")';
    } else {
      entitySelector = `type("SYNTHETIC_TEST"),mzName(${scope})`;
    }
    let config = { from: `now-7d`, entitySelector: entitySelector};
    const objects = await monitoredEntitiesClient.getEntities(config);
    // Count monitored apps
    if(scope === "Tenant") {
      entitySelector = 'type("APPLICATION")';
    } else {
      entitySelector = `type("APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const webApps = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("MOBILE_APPLICATION")';
    } else {
      entitySelector = `type("MOBILE_APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);
    if(scope === "Tenant") {
      entitySelector = 'type("CUSTOM_APPLICATION")';
    } else {
      entitySelector = `type("CUSTOM_APPLICATION"),mzName(${scope})`;
    }
    config = { from: `now-7d`, entitySelector: entitySelector};
    const customApps = await monitoredEntitiesClient.getEntities(config);
    const monitoredApps = webApps.totalCount + mobileApps.totalCount + customApps.totalCount;
    const syntheticRatio = objects.totalCount / monitoredApps;
    const score = syntheticRatio >= 3 ? 1 : (syntheticRatio >= 1 ? 0.5 : 0);
    return score;
  }
  
  async function managementZones() {
    let config = { schemaIds: 'builtin:management-zones'};
    let mz = await settingsObjectsClient.getSettingsObjects(config);
    config = { from: "now-1d", entitySelector: 'type("APPLICATION")'};
    const webApps = await monitoredEntitiesClient.getEntities(config);
    config = { from: "now-1d", entitySelector: 'type("MOBILE_APPLICATION")'};
    const mobileApps = await monitoredEntitiesClient.getEntities(config);
    config = { from: "now-1d", entitySelector: 'type("CUSTOM_APPLICATION")'};
    const customApps = await monitoredEntitiesClient.getEntities(config);
    const monitoredApps = webApps.totalCount + mobileApps.totalCount + customApps.totalCount;
    config = { from: "now-7d", entitySelector: 'type("APPLICATION")', fields: 'managementZones', pageSize: 500};
    const objects = await monitoredEntitiesClient.getEntities(config);
    const appsWithNoMz = objects.entities.filter(el => el.managementZones.length === 0);
    const score = appsWithNoMz.length === 0 ? 1 : 0;
    return score;
  }
  
  async function autoTags() {
    const config = { schemaIds: 'builtin:tags.auto-tagging'};
    const objects = await settingsObjectsClient.getSettingsObjects(config);
    const score = objects.totalCount >= 10 ? 1 : (objects.totalCount >= 3 ? 0.5 : 0);
    return score;
  }
  
  async function manualTags() {
    let allCustomTags = [];
    let entityTypes = ['SYNTHETIC_TEST', 'APPLICATION', 'MOBILE_APPLICATION', 'CUSTOM_APPLICATION', 'SERVICE', 'PROCESS_GROUP', 'HOST'];
    for(let entityType of entityTypes) {
      let customTags = await monitoredEntitiesCustomTagsClient.getTags({ entitySelector: `type("${entityType}")` });
      customTags = customTags.tags.map(el => el.key);
      allCustomTags = [...allCustomTags, ...customTags];
    }
    const score = allCustomTags.length < 50 ? 1 : 0;
    return score;
  }
  
  async function alertingProfiles() {
    let config = { schemaIds: 'builtin:management-zones'};
    const mz = await settingsObjectsClient.getSettingsObjects(config);
    config = { schemaIds: 'builtin:alerting.profile'};
    const alertingProfiles = await settingsObjectsClient.getSettingsObjects(config);
    const score = alertingProfiles.totalCount >= mz.totalCount ? 1 : (alertingProfiles.totalCount >= 5 ? 0.5 : 0);
    return score;
  }
  
  async function integrations() {
    let config = { schemaIds: 'builtin:problem.notifications'};
    const integrations = await settingsObjectsClient.getSettingsObjects(config);
    config = { schemaIds: 'builtin:alerting.profile'};
    const alertingProfiles = await settingsObjectsClient.getSettingsObjects(config);
    const score = integrations.totalCount >= alertingProfiles.totalCount * 1.5 ? 1 : (integrations.totalCount >= alertingProfiles.totalCount ? 0.5 : 0);
    return score;
  }
  
  async function integrationTypes() {
    let config = { schemaIds: 'builtin:problem.notifications'};
    const objects = await settingsObjectsClient.getSettingsObjects(config);
    let integrationTypes = [];
    for(let object of objects.items) {
      integrationTypes.push(object.value.type);
    }
    integrationTypes = integrationTypes.filter(onlyUnique);
    const score = integrationTypes.length >= 5 ? 1 : (integrationTypes.length >= 2 ? 0.5 : 0);
    return score;
  }
  
  async function metricEvents() {
    let config = { schemaIds: 'builtin:anomaly-detection.metric-events', pageSize: 500};
    let objects = await settingsObjectsClient.getSettingsObjects(config);
    let metricEvents = objects.items;
    while(objects.nextPageKey) {
      config = { nextPageKey: objects.nextPageKey };
      objects = await settingsObjectsClient.getSettingsObjects(config);
      metricEvents = [...metricEvents, ...objects.items];
    }
    const enabledMetricEventCount = metricEvents.filter(el => el.value.enabled).length;
    const score = enabledMetricEventCount >= 5 ? 1 : 0;
    return score;
  }
  
  async function slos() {
    let objects;
    const config = { schemaIds: 'builtin:monitoring.slo'};
    try {
      objects = await settingsObjectsClient.getSettingsObjects(config);
    } catch(e) {}
    let enabledSlos = 0;
    if(objects) {
      for(let slo of objects.items) {
        if(slo.value.enabled) enabledSlos++;
      }
    }
    const score = enabledSlos >= 10 ? 1 : (enabledSlos > 0 ? 0.5 : 0);
    return score;
  }
  
  async function releaseIntegrations() {
    let objects;
    const config = { schemaIds: 'builtin:issue-tracking.integration'};
    try {
      objects = await settingsObjectsClient.getSettingsObjects(config);
    } catch(e) {}
    let enabledIssueTrackingSystems = 0;
    if(objects) {
      for(let enabledIssueTrackingSystem of objects.items) {
        if(enabledIssueTrackingSystem.value.enabled) enabledIssueTrackingSystems++;
      }
    }
    const score = enabledIssueTrackingSystems >= 5 ? 1 : (enabledIssueTrackingSystems >= 2 ? 0.5 : 0);
    return score;
  }
  
  async function logMonitoring() {
    const config = { schemaIds: 'builtin:logmonitoring.log-storage-settings'};
    let objects = { items: [] };
        try {
          objects = await settingsObjectsClient.getSettingsObjects(config);  
        } catch(e) {}
    const logStorageIncludeRules = objects.items.filter(el => el.value.enabled).length;
    const score = logStorageIncludeRules > 0 ? 1 : 0;
    return score;
  }
  
  async function thirdPartyVulnerabilityAnalytics() {
    let objects;
    const config = { schemaIds: 'builtin:appsec.runtime-vulnerability-detection'};
    try {
      objects = await settingsObjectsClient.getSettingsObjects(config);
    } catch(e) {}
    const score = objects && objects.items[0] && objects.items[0].value && objects.items[0].value.enableRuntimeVulnerabilityDetection ? 1 : 0;
    return score;
  }
  
  async function codeLevelVulnerabilityAnalytics() {
    let objects;
    const config = { schemaIds: 'builtin:appsec.runtime-vulnerability-detection'};
    try {
      objects = await settingsObjectsClient.getSettingsObjects(config);
    } catch(e) {}
    const score = objects && objects.items[0] && objects.items[0].value && objects.items[0].value.enableCodeLevelVulnerabilityDetection ? 1 : 0;
    return score;
  }
  
  async function runtimeApplicationProtection() {
    let objects;
    const config = { schemaIds: 'builtin:appsec.attack-protection-settings'};
    try {
      objects = await settingsObjectsClient.getSettingsObjects(config);
    } catch(e) {}
    const score = objects && objects.items[0] && objects.items[0].value && objects.items[0].value.enabled ? 1 : 0;
    return score;
  }
  
  async function dashboards() {
    const config = { filter: "type = 'dashboard'"};
    let objects = await documentsClient.listDocuments(config);
    const score = objects.totalCount >= 10 ? 1 : (objects.totalCount >= 5 ? 0.5 : 0);
    return score;
  }
  
  async function notebooks() {
    const config = { filter: "type = 'notebook'"};
    let objects = await documentsClient.listDocuments(config);
    const score = objects.totalCount >= 10 ? 1 : (objects.totalCount >= 5 ? 0.5 : 0);
    return score;
  }
  
  async function cloudIntegrations() {
    // Count cloud integrations
    let config = { writtenSince: "now-1d", acceptType: "application/json; charset=utf-8", text: "builtin:cloud", pageSize: 500 };
    let objects = await metricsClient.allMetrics(config);
    let metrics = objects.metrics;
    while(objects.nextPageKey) {
      config = { acceptType: "application/json; charset=utf-8", nextPageKey: objects.nextPageKey };
      objects = await metricsClient.allMetrics(config);
      metrics = [...metrics, ...objects.metrics];
    }
    let cloudIntegrationCount = metrics.map(el => el.metricId.substring("builtin:cloud.".length,("builtin:cloud.".length + el.metricId.substring("builtin:cloud.".length).indexOf(".")))).filter(onlyUnique).length;
    // Count Kubernetes integrations
    config = { from: "now-1d", entitySelector: `type("KUBERNETES_CLUSTER")` };
    objects = await monitoredEntitiesClient.getEntities(config);
    if(objects.totalCount) cloudIntegrationCount++;
    const score = cloudIntegrationCount >= 3 ? 1 : 0;
    return score;
  }
  
  async function extensions() {
    const config = { acceptType: "application/json; charset=utf-8", metricSelector: 'dsfm:extension.extensions_count:last(avg)'};
    const objects = await metricsClient.query(config);
    const extensionCount = objects.result[0].data[0].values[0];
    const score = extensionCount >= 10 ? 1 : (extensionCount > 0 ? 0.5 : 0);
    return score;
  }
  
  async function extensionConfigurations() {
    let config = { acceptType: "application/json; charset=utf-8", metricSelector: 'dsfm:extension.extensions_monitoring_configuration_count:last(avg)'};
    let objects = await metricsClient.query(config);
    const extensionConfigCount = objects.result[0].data[0].values[0];
    config = { acceptType: "application/json; charset=utf-8", metricSelector: 'dsfm:extension.extensions_count:last(avg)'};
    objects = await metricsClient.query(config);
    const extensionCount = objects.result[0].data[0].values[0];
    const score = extensionConfigCount >= extensionCount * 1.5 ? 1 : (extensionConfigCount >= extensionCount ? 0.5 : 0);
    return score;
  }
  
  async function networkZones() {
    const config = { schemaIds: 'builtin:networkzones'};
    const objects = await settingsObjectsClient.getSettingsObjects(config);
    const score = objects.totalCount > 0 ? 1 : 0;
    return score;
  }
  
  async function ownershipTeams() {
    let config = { schemaIds: 'builtin:ownership.teams'};
    const objects = await settingsObjectsClient.getSettingsObjects(config);
    const score = objects.items.length >= 10 ? 1 : (objects.items.length >= 5 ? 0.5 : 0);
    return score;
  }
  
  async function auditLogs() {
    const config = { schemaIds: 'builtin:audit-log'};
    const objects = await settingsObjectsClient.getSettingsObjects(config);
    const score = objects && objects.items[0] && objects.items[0].value && objects.items[0].value.enabled ? 1 : 0;
    return score;
  }
  
  async function oneAgentVersions() {
    const oldestSupportedVersion = Math.round((Date.now()/1000 - 1363125600)/(60*60*24*7*2*2))*2 - 1 - 18;
    const latestVersion = Math.round((Date.now()/1000 - 1363125600)/(60*60*24*7*2*2))*2 - 1 + 2;
    let config = { from: "now-5m", acceptType: "application/json; charset=utf-8", metricSelector: 'dsfm:cluster.oneagent.agent_modules:filter(and(or(eq("dt.oneagent.agent_type",os)))):splitBy("dt.oneagent.version"):sum:last():sort(value(sum,descending)):limit(100)'};
    let objects = await metricsClient.query(config);
    const oneAgentVersionStats = {
      records: [],
      types: [
        {
          mappings: {
            oneAgentVersion: {
              type: "string"
            },
            running: {
              type: "long"
            }
          },
          indexRange: [
            0,
            1
          ]
        }
      ]
    };
    for(let oneAgentVersion of objects.result[0].data) {
      const score = oneAgentVersion.dimensionMap['dt.oneagent.version'].substring(2) >= (latestVersion - 6) ? 1 : (oneAgentVersion.dimensionMap['dt.oneagent.version'].substring(2) >= oldestSupportedVersion ? 0.5 : 0);
      let result = {};
      switch(true) {
        case score === 1:
          result.oneAgentVersion = `✅ ${oneAgentVersion.dimensionMap['dt.oneagent.version']}`;
          break;
        case score === 0.5:
          result.oneAgentVersion = `💡 ${oneAgentVersion.dimensionMap['dt.oneagent.version']}`;
          break;
        case score === 0:
          result.oneAgentVersion = `⚠️ ${oneAgentVersion.dimensionMap['dt.oneagent.version']}`;
          break;
      }
      result.running = oneAgentVersion.values[0];
      oneAgentVersionStats.records.push(result);
    }
    const score = oneAgentVersionStats.records.findIndex(el => el.oneAgentVersion.substring(4) < (latestVersion - 6)) === -1 ? 1 : (oneAgentVersionStats.records.findIndex(el => el.oneAgentVersion.substring(4) < oldestSupportedVersion) === -1 ? 0.5 : 0);
    return score;
  }
  
  async function activeGateVersions() {
    const oldestSupportedVersion = Math.round((Date.now()/1000 - 1363125600)/(60*60*24*7*2*2))*2 - 1 - 18;
    const latestVersion = Math.round((Date.now()/1000 - 1363125600)/(60*60*24*7*2*2))*2 - 1 + 2;
    const objects = await activeGatesClient.getAllActiveGates();
    const names = objects.activeGates.map(el => {
      const filteredEntry = {};
      switch(true) {
      case el.version.substring(2,5) < oldestSupportedVersion:
        filteredEntry.Version = `⚠️ ${el.version}`;
        break;
      case el.version.substring(2,5) < (latestVersion - 6):
        filteredEntry.Version = `💡 ${el.version}`;
        break;
      default:
        filteredEntry.Version = `✅ ${el.version}`;
      }
      filteredEntry.ActiveGate = el.hostname;
      return filteredEntry;
    });
    const score = names.findIndex(el => el.Version.substring(4,7) < (latestVersion - 6)) === -1 ? 1 : (names.findIndex(el => el.Version.substring(4,7) < oldestSupportedVersion) === -1 ? 0.5 : 0);
    return score;
  }
  
  export default async function() {
    let totalWeightedScore = 0;
    // Determine what indicators should be evaluated based on the selected DTR scope
    let scopedIndicators;
    if($Scope[0] === "Tenant") {
      scopedIndicators = tenantIndicators;
    } else {
      scopedIndicators = managementZoneIndicators;
    }
    // Determine what indicators should be evaluated based on the selected indicators
    let selectedIndicators = [];
    if($Indicators[0] === "All") {
      selectedIndicators = scopedIndicators;
    } else {
      for(let scopedIndicator of scopedIndicators) {
        if($Indicators.includes(scopedIndicator.name)) {
          selectedIndicators.push(scopedIndicator); 
        }
      }
    }
    // Evaluate indicators and increment totalWeightedScore by their weighted local score
    for(let selectedIndicator of selectedIndicators) {
      totalWeightedScore += await getWeightedScore(selectedIndicator);
    }
    // Compute what's the maximum weighted score that can be expected based on the selected indicators
    const maxWeightedTotalScore = getMaxWeightedTotalScore(selectedIndicators);
    // Divide totalWeightedScore by maxWeightedTotalScore to get the totalScorePercent
    const totalScorePercent = Math.floor((totalWeightedScore / maxWeightedTotalScore) * 100);
    // Return the emojied totalScorePercent
    let result;
    switch(true) {
      case totalScorePercent >= 95:
        result = `⭐ ${totalScorePercent}%`;
        break;
      case totalScorePercent >= 80:
        result = `✅ ${totalScorePercent}%`;
        break;
      case totalScorePercent >= 50:
        result = `💡 ${totalScorePercent}%`;
        break;
      default:
        result = `⚠️ ${totalScorePercent}%`;
    }
    return result;
  }