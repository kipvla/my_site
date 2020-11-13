<script>
    export let title = "My first post";
    export let date = "Friday November 13, 2020";
    export let time = "4:00 PM";
    export let image = "images/cat.jpg";
    export let body = "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Assumenda ducimus distinctio necessitatibus quo repellendus sed explicabo eveniet, omnis blanditiis reiciendis amet perferendis, quod minima consequatur dolores eius, cumque repudiandae praesentium?";
</script>

<div class="container blog-post">
    <div class="col col-lg-3"></div>
    <div class="col col-lg-6">
        <h2>{title}</h2>
        <h5>{date}</h5>
        <h5>{time}</h5>
        <img src="{image}" alt="">
        <p>{body}</p>
    </div>
    <div class="col col-lg-3"></div>

</div>