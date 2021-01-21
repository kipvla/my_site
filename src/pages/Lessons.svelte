<script>
  import { fly } from 'svelte/transition';

  import Lesson from "../components/Lessons/Lesson.svelte";
</script>

<div class="lessons-container">
  <img src="images/KR13-min.jpg" id="lesson-img" alt="" transition:fly="{{y: 200, duration: 4000}}"/>
  
  <Lesson />
  <!-- <LessonOption /> -->
</div>