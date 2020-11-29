<script>
    export let title = "My first post";
    export let date = "Friday November 13, 2020";
    export let time = "4:00 PM";
    export let image = "images/KR11.jpg";
    export let body = "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Assumenda ducimus distinctio necessitatibus quo repellendus sed explicabo eveniet, omnis blanditiis reiciendis amet perferendis, quod minima consequatur dolores eius, cumque repudiandae praesentium?";
</script>

<div class="container">
    <div class="col col-lg-2"></div>
    <div class="col col-lg-8 blog-post">
        <h2>{title}</h2>
        <img class="blog-image" src="{image}" alt="">
        <h5>{date}</h5>
        <h5>{time}</h5>
        <p class="text-justify">{body}</p>
    </div>
    <div class="col col-lg-2"></div>
    <hr>
</div>