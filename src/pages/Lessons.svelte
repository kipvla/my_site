<script>
  import { fade } from 'svelte/transition';

  import Lesson from "../components/Lessons/Lesson.svelte";
</script>

<div class="lessons-container">
  <img src="images/KR13-min.jpg" id="lesson-img" alt="" in:fade="{{duration: 2000}}"/>
  <Lesson />
</div>