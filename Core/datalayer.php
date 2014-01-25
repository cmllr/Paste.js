<?php
	error_reporting(E_ALL);
	$connect = mysqli_connect("localhost", "", "") or die("Error: 005 ".mysqli_error());
	mysqli_select_db($connect,"Paste") or die("Error: 006 ".mysqli_error()); 	
	if (isset($_POST["method"])){
		mysqli_query($connect,"SET NAMES 'utf8'");
		mysqli_query($connect,"SET CHARACTER SET 'utf8'");
	}			
	if (!isset($_GET["task"])){
		die(json_encode("No task given"));
	}
	else{
		switch ($_GET["task"]) {
			case '0x1':
				$results = array();
				$results[0] = getFreeGUID($connect);
				$results[1] = getFreePRIVATEGUID($connect);
				storePad($connect,$_POST["content"],$results[0],$results[1],$_POST["date"]);
				echo json_encode($results);
				break;	
			case '0x2':				
				$results = loadPad($connect,$_POST["pad"]);			
				$encode =  json_encode($results);
				echo $encode;
				break;	
			case '0x3':
				$results = getStats($connect);		
				echo str_replace("\"","",json_encode(array_values($results)));
				break;	
			case '0x4':
				$results = getTicks($connect);		
				echo json_encode(array_values($results));
				break;	
			case '0x5':
				$results = updatePad($connect,$_POST["content"],$_POST["PrivateGuid"],$_POST["date"]);
				echo json_encode($results);
				break;	
			case '0x6':
				echo json_encode(checkInstall($connect));
				break;												
			default:
				echo "wtf?";
				break;
		}
	}
	function checkInstall($connect){
		if(file_exists("./dump.sql"))
		{
			$content = file_get_contents("./dump.sql",FILE_USE_INCLUDE_PATH);			
			if(!mysqli_query($connect,$content))
					return mysqli_error($connect);
			unlink("./dump.sql");
			return $content;
		}
	}
	function getStats($connect){
		$query = "select count(Guid) as Number,date(Creation) as Day from Pads group by date(Creation) limit 7";
		$result = array();		
		$dbresult = mysqli_query($connect,$query);	
		while ($row = mysqli_fetch_object($dbresult)) {
			$result[$row->Day] = $row->Number;
		}		
		return $result;
	}
	function getTicks($connect){
		$query = "select count(Guid) as Number,date(Creation) as Day from Pads group by date(Creation) limit 7";
		$result = array();		
		$dbresult = mysqli_query($connect,$query);	
		while ($row = mysqli_fetch_object($dbresult)) {
			$result[] = $row->Day;	   
		}		
		return $result;
	}
	function loadPad($connect,$pad){
		$result = null;
		$pad =  mysqli_real_escape_string($connect,$pad);
		$dbresult = mysqli_query($connect,"Select Content from Pads where GUID = '$pad ' or PRIVATEGUID = '$pad' LIMIT 1");
		while ($row = mysqli_fetch_object($dbresult)) {
			$result =html_entity_decode ($row->Content);	
		}
		return $result;
	}
	function storePad($connect,$content,$guid,$privateguid,$date){
		$content = htmlentities(mysqli_real_escape_string($connect,$content));
		$guid = filter_var(mysqli_real_escape_string($connect,$guid), FILTER_SANITIZE_STRING);
		$privateguid = filter_var(mysqli_real_escape_string($connect,$privateguid), FILTER_SANITIZE_STRING);
		$date = filter_var(mysqli_real_escape_string($connect,$date), FILTER_SANITIZE_STRING);
		mysqli_query($connect,"Insert into Pads (GUID,PRIVATEGUID,Content,Creation) values ('$guid','$privateguid','$content','$date')");
	}
	function updatePad($connect,$content,$privateguid,$date){
		$content =  htmlentities(mysqli_real_escape_string($connect,$content));
		$privateguid = filter_var(mysqli_real_escape_string($connect,$privateguid), FILTER_SANITIZE_STRING);
		$date = filter_var(mysqli_real_escape_string($connect,$date), FILTER_SANITIZE_STRING);
		mysqli_query($connect,"Update Pads set content = '$content' where PRIVATEGUID ='$privateguid'");
		$dbresult = mysqli_query($connect,"Select Guid,PrivateGuid from Pads where PRIVATEGUID = '$privateguid' LIMIT 1");
		$result = array();
		while ($row = mysqli_fetch_object($dbresult)) {
			$result[] = $row->Guid;
			$result[] = $row->PrivateGuid;
		}
		return $result;
	}
	function getFreeGUID($connect){
		$found =false;
		$code = getRandomKey($connect,20);
		do{				
			mysqli_query($connect,"Select GUID  from `Pads` where  GUID = '$code'");
			if (mysqli_affected_rows($connect) > 0)
			{
				$code = getRandomKey($connect,20);
				$found = true;					
			}
		}while($found == true );			
		return $code;
	}
	function getFreePRIVATEGUID($connect){
		$found =false;
		$code = getRandomKey($connect,20);
		do{				
			mysqli_query($connect,"Select PRIVATEGUID  from `Pads` where  PRIVATEGUID = '$code'");
			if (mysqli_affected_rows($connect) > 0)
			{
				$code = getRandomKey($connect,20);
				$found = true;					
			}
		}while($found == true );			
		return $code;
	}
	function getRandomKey($connect,$length) {
		
		$chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		$s_length = strlen($chars);
		$randomString = "";
		if ($length <= $s_length){
			$randomString = substr(str_shuffle($chars), 0, $length);
		
		}
		else
		{
			$iterations = $length/$s_length;
			$singlePart = $length/$iterations;
			for ($i = 0; $i < $iterations ;$i++)
			{
				$randomString = $randomString.substr(str_shuffle($chars), 0, $singlePart);
			}
		}
		return $randomString;
    }
?>