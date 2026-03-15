<script setup lang="ts">
const route = useRoute()

await navigateTo(
  {
    path: '/products/leadku',
    query: route.query,
    hash: route.hash,
  },
  {
    redirectCode: 301,
    replace: true,
  },
)
</script>
