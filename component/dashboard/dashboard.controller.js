/*jslint browser:true*/
/*global angular, d3*/
(function () {
    "use strict";
    function dashboardCtrl(dashboardService) {
        var content = {};
        content.getAllPlanets = function () {
            content.selectedPlanet = null;
            dashboardService.getPlanets(content.planetSearchParam).then(function (planets) {
                content.allPlanets = planets;
                content.chartApi.refresh(content.allPlanets);
            });
        };
        content.doPlanetSearch = function () {
            content.getAllPlanets();
        };
        content.selectPlanet = function (planet) {
            content.selectedPlanet = planet;
            content.planetSearchParam = "";
            content.allPlanets = null;
        };
        content.planetSearchParam = "al";
        content.getAllPlanets();
        return content;
    }
    angular.module("xebiaSwApp").controller("dashboardCtrl", ["dashboardService", dashboardCtrl]);
}());
