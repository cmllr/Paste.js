/**
* Paste.js - paste and share documents with links
* Version 1.0.2 beta
*/
var myApp = angular.module('Paste.js',[]);
myApp.controller('ServiceController',['$scope','MetaFactory', function($scope,MetaFactory) {
    //Program Constants
    $scope.APPNAME = "Paste.js";   
    $scope.APPVERSION = "1.0.2 beta"; 
    //Document properties
    $scope.DocumentMeta= MetaFactory;
    $scope.DocumentMeta.Title = "unnamed document";
    $scope.DocumentMeta.Content = "Welcome to " + $scope.APPNAME + ". This software "; 
    //Globals
    $scope.isBoxOpen = false;
    $scope.StatusText = "Idle";
    $scope.willDeletePad = false;
    $scope.PadDeletionDuration = 80;
    $scope.EditMode = false;
    //The datalayer. Can be changed if you have another datalayer.
    $scope.datalayer = "./Core/datalayer.php";
    $scope.refreshTitle = function(newname){        
      $scope.DocumentMeta.Title = newname;   
    }
    $scope.showOrHideDownloadBox = function(){
      if ($scope.DocumentMeta.isSaved == false && $scope.DocumentMeta.isReadOnly == false){
        console.log("store isn saved");        
        if (!$scope.storePad()){
           jQuery("#errorBox").fadeIn(1400,function(){
             jQuery("#errorBox").delay(4000);
             jQuery("#errorBox").fadeOut(1400);
           });
           return;
        }      
      }          
      if ($scope.isBoxOpen){
        jQuery("#downloadBox").fadeOut();
        $scope.isBoxOpen = false;
      }
      else{
        jQuery("#downloadBox").fadeIn();
        $scope.isBoxOpen = true;
      }
    }
    $scope.hideDownloadBox = function(){
      jQuery("#downloadBox").fadeOut();
      jQuery("#InfoBox").fadeOut();
      jQuery("#StatusBox").fadeOut();
      $scope.isBoxOpen = false;
      $scope.hideStatus();
    }
    $scope.storePad = function(){
      var stored = $scope.savePad();     
      if (stored.length != 0){
        if ($scope.EditMode == false && $scope.isReadOnly == true){
          $scope.DocumentMeta.Guid = stored[0];
          $scope.DocumentMeta.PrivateGuid = stored[0];
        }
        else if ($scope.EditMode){          
          $scope.DocumentMeta.Guid = stored[0];
          $scope.DocumentMeta.PrivateGuid = stored[1];
        }        
        else {
          $scope.DocumentMeta.Guid = stored[0];
          $scope.DocumentMeta.PrivateGuid = stored[1];
        }
        return true;
      }   
      return false;
    }
    $scope.savePad = function(){      
      var results = [];
      $scope.DocumentMeta.CreationDate =  new Date(); 
      if ($scope.EditMode == false && ($scope.DocumentMeta.Guid == null || $scope.DocumentMeta.PrivateGuid == null)){
          jQuery.ajax({
              global: false,
              async:   false,
              type: "POST",
              cache: false,
              dataType: "json",
              data: ({
                  action: 'read',
                  content: $scope.DocumentMeta.Content,
                  date: $scope.DocumentMeta.CreationDate.toISOString().slice(0, 19).replace('T', ' '),
              }),
              url: $scope.datalayer+'?task=0x1',
              success: function(data){
                  JavaScriptJSON_Obj = data;
                  results = data;        
              },
              error : function(data){
                results = [];
                $scope.DocumentMeta.ErrorMessage = data.responseText;
              }
          });      
        $scope.showStatus("Pad saved " + $scope.DocumentMeta.CreationDate.toISOString());
      }      
      else{     
        jQuery.ajax({
              global: false,
              async:   false,
              type: "POST",
              cache: false,
              dataType: "json",
              data: ({
                  action: 'read',
                  content: $scope.DocumentMeta.Content,
                  PrivateGuid: $scope.DocumentMeta.PrivateGuid,                  
                  date: $scope.DocumentMeta.CreationDate.toISOString().slice(0, 19).replace('T', ' '),
              }),
              url: $scope.datalayer+'?task=0x5',
              success: function(data){
                  JavaScriptJSON_Obj = data;
                  results = data;                            
              },
              error : function(data){
                results = [];
                $scope.DocumentMeta.ErrorMessage = data.responseText;
              }
          });      
        $scope.showStatus("Pad updated " + $scope.DocumentMeta.CreationDate.toISOString());
      }
      return results;
    }
    $scope.setTitle = function(){
       if ($scope.DocumentMeta.Content == null){
            $scope.DocumentMeta.ErrorMessage = "The pad is not existing";
              jQuery("#errorBox").fadeIn(1400,function(){
          });
          return;
      }
      var text = $scope.DocumentMeta.Content;
      var title = text.substring(0,8);
      $scope.refreshTitle(title);
    }
    $scope.showStatus = function(text){
      $scope.StatusText = text;
      jQuery("#statusText").fadeIn(400);
    }
    $scope.hideStatus = function(){
      jQuery("#statusText").fadeOut(400);
    }
    $scope.getUrlParameters = function(){ 
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            if (hash[0] == "pad")
            {
              $scope.openPad(hash[1],false);
              return;
            }
            if (hash[0] == "epad")
            {
              $scope.openPad(hash[1],true);
              return;
            }
        } 
        $scope.openPad("start",false);
    }
    $scope.openPad = function(pad,edit){
      var results = [];
      $scope.DocumentMeta.CreationDate =  new Date();
      jQuery.ajax({
          global: false,
          async:   false,
          type: "POST",
          cache: false,
          dataType: "json",
          data: ({
              action: 'read',
              pad: pad,
          }),
          url: $scope.datalayer+'?task=0x2',
          success: function(data){
              JavaScriptJSON_Obj = data;
              results = data;      
              $scope.DocumentMeta.Content = data;  
              if (pad != "start"){
                if (edit == false){
                   $scope.DocumentMeta.isReadOnly = true;
                   $scope.DocumentMeta.isSaved = true;
                   $scope.DocumentMeta.Guid = pad;                     
                   $scope.DocumentMeta.PrivateGuid = null;
                   $scope.EditMode = false;
                 } 
                 else{
                   $scope.DocumentMeta.PrivateGuid = pad;   
                   $scope.EditMode = true;
                 }                
              }
              else{                 
                  $scope.DocumentMeta.isSaved = false;            
              }     
              $scope.setTitle();
          },
          error : function(data){
            results = [];  
            jQuery("#errorBox").fadeIn(1400,function(){
              jQuery("#errorBox").delay(4000);
              jQuery("#errorBox").fadeOut(1400);
            });
          }
      });
      return results;
    }
    $scope.showOrHideInfoBox = function(){         
      if (jQuery("#InfoBox").css("display") != "none"){
        jQuery("#InfoBox").fadeOut();
      }
      else{
        jQuery("#InfoBox").fadeIn();
      }     
    }
    $scope.showOrHideStatsBox = function(){   
      $scope.getStats();      
      if (jQuery("#StatusBox").css("display") != "none"){
        jQuery("#StatusBox").fadeOut();
      }
      else{
        jQuery("#StatusBox").fadeIn();
      }     
    }
    $scope.drawStats = function(s1){ 
      var myvalues = s1;
      jQuery('#stats').sparkline(myvalues, {type: 'line', lineColor: '#057AAD',width:"200",height: "50"} );
    }
    $scope.getStats = function(){
      var results = [];   
      jQuery.ajax({
          global: false,
          async:   true,
          type: "POST",
          cache: false,
          dataType: "json",        
          url:$scope.datalayer+'?task=0x3',
          success: function(data){
              results = data;  
              $scope.drawStats(data);
          },
          error : function(data){
            results = [];       
          }
      });      
    }
    $scope.getTicks = function(){
      var results = [];   
      jQuery.ajax({
          global: false,
          async:   false,
          type: "POST",
          cache: false,
          dataType: "json",        
          url: $scope.datalayer+'?task=0x4',
          success: function(data){
              results = data;  
          },
          error : function(data){
            results = [];      
          }
      }); 
      return results;     
    }   
}]);  
myApp.factory("MetaFactory", function(){
     return {
        Title:  null,
        Content: null,
        Guid: null,
        PrivateGuid:null,
        isSaved:false,
        isReadOnly:false,
        CreationDate: null,
        ErrorMessage: null,
     };
});