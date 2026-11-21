<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { cn } from '~/src/shared/utils'
import { Primitive } from 'radix-vue'
import { type ButtonVariants, buttonVariants } from '.'

interface Props {
  as?: string | Component
  asChild?: boolean
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
