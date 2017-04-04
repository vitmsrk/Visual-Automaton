function modalCtrl(params) {
    return function ($scope, $mdDialog) {
        $scope.translation = $scope.$parent.translation;
        $scope.preferences = $scope.$parent.preferences;
        $scope.params = params;

        $scope.hide = function () {
		    $mdDialog.hide();
        };

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.apply = function (answer) {
            $mdDialog.hide(answer);
        };
    }
}