app.controller('TabsDemoCtrl', function ($scope, $window) {
  $scope.tabs = [
    { title:'Dynamic Title 1', content:'Dynamic content 1' },
    { title:'Dynamic Title 2', content:'Dynamic content 2', disabled: true }
  ];

  $scope.alertMe = function() {
    setTimeout(function() {
      $window.alert('You\'ve selected the alert tab!');
    });
  };

  $scope.model = {
    name: 'Tabs'
  };
});


app.controller('ModalDemoCtrl', function ($scope, $uibModal, $log) {

  $scope.items = ['item1', 'item2', 'item3'];

  $scope.animationsEnabled = true;

  $scope.open = function (size) {

    var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: size,
      resolve: {
        items: function () {
          return $scope.items;
        }
      }
    });

    modalInstance.result.then(function (selectedItem) {
      $scope.selected = selectedItem;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

  $scope.toggleAnimation = function () {
    $scope.animationsEnabled = !$scope.animationsEnabled;
  };

});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, items) {

  $scope.items = items;
  $scope.selected = {
    item: $scope.items[0]
  };

  $scope.ok = function () {
    $uibModalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});

app.service("mysql", function ($q) {
	var S={};
	var mySQLClient = new MySQL.Client();
    mySQLClient.setSocketImpl(new MySQL.ChromeSocket2());
	var client = new MySQL.Client();
	client.setSocketImpl(new MySQL.ChromeSocket2());
	S.connect=function(host, port,user,pwd){
		var promise=$q.defer();
		console.info(host, Number(port),user,pwd)
		client.login(
			  host, Number(port),user,pwd,{},
			  function(initialHandshakeRequest, result) {
				if (result && result.isSuccess()) {
				  var serverVersion = initialHandshakeRequest.serverVersion;
				  var protocolVersion = initialHandshakeRequest.protocolVersion;
				  promise.resolve();
				} else {
				  
				  promise.reject('Error Connect');
				}
				client.logout();
			  }, function(errorCode) { // Error returned from MySQL server
				promise.reject('Error returned from MySQL server |'+errorCode);
			  }, function(result) { // Cannot connect to MySQL server
				promise.reject('Cannot connect to MySQL server');
			  });	
		return promise.promise;
	}
	S.logout=function()
	{
		 var deferred = $q.defer();
		  mySQLClient.logout(deferred.resolve,deferred.resolve)
		 return deferred.promise;
	}
	
	S.login= function(hostName, portNumber, userName, password) { 
            
            
            var deferred = $q.defer();
           
            mySQLClient.login(
                hostName,
                Number(portNumber),
                userName,
                password,
                false,
                function(initialHandshakeRequest, result) {
                    S.logout().then(function(){
						if (result && result.isSuccess()) {
                        
							deferred.resolve(initialHandshakeRequest);
						} else {
						   
							deferred.reject(result?result.errorMessage:'Error Connection');
						}
					})
                    
					
					 
                }, function(errorCode) {
                     
                    
                    deferred.reject(errorCode);
                }, function(result) {
                     
                    
                    deferred.reject(result);
                }
            );
            return deferred.promise;
        }
	return S;
});

app.controller("connectCtrl", function ($scope,mysql) {
   $scope.data={
	 host:'localhost',  
	 port:'3303',  
	 user:'safa',  
	 pwd:'A12345678',  
	   
   };
   $scope.data.mes="";
   $scope.connect=function(){
			$scope.data.mes="......";
			mysql.connect($scope.data.host,$scope.data.port,$scope.data.user,$scope.data.pwd)
			.then(function(){
				$scope.data.mes="Success";
			}).catch(function(err){
				$scope.data.mes=err;
			})
   }
   
});