<script>
import BlogPost from './BlogPost.svelte'

    const fetchBlogs = fetch(`/api/blogposts`)
        .then((data) => {
            console.log('succ', data);
            return data.json();
        })
        .catch((data) => {
            console.log('error', data);
            return data;
        });
</script>

{#await fetchBlogs}
    <div class="container d-flex justify-content-center mt-5">
        <p class='m-5 p-5'>...waiting</p>
    </div>
{:then data}
    {#each data.places as place}
       <BlogPost {...place} />
    {/each}
{:catch error}
    <p>An error occurred! {`${error}`}</p>
{/await}