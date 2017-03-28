function transitionTableCtrl($scope, $mdDialog) {
	$scope.translation = $scope.$parent.translation;
	$scope.table = $scope.$parent.tabs[$scope.$parent.current].transitionTable;
	$scope.preferences = $scope.$parent.preferences;
	console.log($scope);

	$scope.hide = function () {
		$mdDialog.hide();
	};

	$scope.cancel = function () {
		$mdDialog.cancel();
	};

	$scope.apply = function () {
		$mdDialog.hide();
	};
}