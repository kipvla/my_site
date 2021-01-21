<script>
    import {fade} from 'svelte/transition';
</script>

<div class="hero" in:fade="{{duration: 3000}}"/>

<style>
  .hero {
    background-image: url("/images/KR28-min.jpg");
    background-size: cover;
    background-position: 48% center;
    height: 800px;
  }
</style>
