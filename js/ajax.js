<script>
	function kb_source_2_target() {
		$.get('/pages/impressum.html', function(data) {
			$('#target').html(data);	
		})
	}
</script>
