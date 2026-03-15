<script setup lang="ts">
const route = useRoute()

await navigateTo(
  {
    path: '/products/pantau',
    query: route.query,
    hash: route.hash,
  },
  {
    redirectCode: 301,
    replace: true,
  },
)
</script>
