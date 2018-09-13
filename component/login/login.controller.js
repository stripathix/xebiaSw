/*jslint browser:true*/
/*global angular, d3*/
/*property
    $parent, MainCtrl, account, authenticate, controller, go, loadUserObj,
    loginNow, module, password, status, then, userObj, username
*/

(function () {
    "use strict";
    function loginCtrl(loginService, $state, $scope) {
        var content = {};
        var MainCtrl = $scope.$parent.MainCtrl;
        content.account = {
            username: "luke skywalker",
            password: "19BBY"
        };
        content.loginNow = function () {
            content.userObj = {};
            loginService.authenticate(content.account).then(function (userobj) {
                content.userObj = userobj;
                MainCtrl.loadUserObj();
                if (userobj.status !== false) {
                    $state.go("dashboard");
                }
            });
        };
        return content;
    }
    angular.module("xebiaSwApp").controller("loginCtrl", ["loginService", "$state", "$scope", loginCtrl]);
}());
