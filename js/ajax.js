<script>
	function kb_source_2_target() {
		$.get('source.html', function(data) {
			$('#target').html(data);	
		})
	}
</script>
