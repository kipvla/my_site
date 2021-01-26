<script>
    import Bob from './Bob.svelte';
    const fetchBlogs = fetch(`/api/blogposts/1`)
        .then((data) => {
            console.log("succ", data);
            return data.json();
        })
        .catch((data) => {
            console.log("error", data);
            return data;
        });
</script>

{#await fetchBlogs}
    <div class="container d-flex justify-content-center mt-5">
        <p>...waiting</p>
    </div>
{:then data}
{console.log(data)}
        <Bob title={data.post.Title} body={data.post.Body} image={data.post.Image} />
{/await}
