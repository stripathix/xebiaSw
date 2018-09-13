/*jslint browser:true*/
/*global angular*/
(function () {
    "use strict";
    function planetDetailsController() {
        var self = {};
        self.$onInit = function () {
        }
        return self;
    }
    angular.module("xebiaSwApp").component("planetDetails", {
        templateUrl: "component/planetDetails/planetDetails.html",
        bindings: {
            planet: "="
        },
        controllerAs: "planetDetailsCtrl",
        controller: planetDetailsController
    });
}());
