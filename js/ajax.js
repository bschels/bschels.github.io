<script>
	function kb_source_2_target() {
		$.get('/pages/datenschutz.html', function(data) {
			$('#target').html(data);	
		})
	}
</script>
