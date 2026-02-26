<?php
	$mode = null;
	
	if(isset($_GET['review']) && $_GET['review'] === 'true') {
		$mode = 'review';
	}
	
	if(isset($_GET['reviewing']) && $_GET['reviewing'] === 'true') {
		$mode = 'reviewing';
	}
?>

<?php if($mode) { ?>
	<script>
		window.REVIEW_MODE = "<?php echo $mode; ?>";
	</script>
	<link rel="stylesheet" href="/rvwr/review-mode.css">
	<script src="/rvwr/review-mode.js"></script>
<?php } ?>