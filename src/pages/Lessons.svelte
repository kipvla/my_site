<script>
  import Lesson from "../components/Lessons/Lesson.svelte";
  import LessonOption from "../components/Lessons/LessonOption.svelte";
</script>

<style>
  .container {
    flex-basis: auto;
  }
</style>

<div class="lessons-container">
  <img src="images/KR9.jpg" id="lesson-img" alt="" />
  <div class="container">
    <div class="lesson-option">
      <div class="lesson-type">
        <h3>Viola lesson</h3>
        <h5>30 or 60 minutes</h5>
        <p />
      </div>
      <div class="lesson-type">
        <h3>Violin lesson</h3>
        <h5>30 or 60 minutes</h5>
        <p />
      </div>
      <div class="lesson-type">
        <h3>Alexander Technique Self-study</h3>
        <h5>45 minutes</h5>
        <p />
      </div>
    </div>
  </div>
  <!-- <Lesson />
  <LessonOption /> -->
</div>
