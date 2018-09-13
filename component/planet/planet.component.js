/*jslint browser:true*/
/*global angular*/
(function () {
    "use strict";
    function planetController() {
        var self = {};
        self.$onInit = function () {
            // console.log(self.planet);
        }
        return self;
    }
    angular.module("xebiaSwApp").component("planetCard", {
        templateUrl: "component/planet/planet.html",
        bindings: {
            planet: "="
        },
        controllerAs: "planetCtrl",
        controller: planetController
    });
}());
