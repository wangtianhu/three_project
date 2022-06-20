<template>
  <div id="box">
    <div id="con1" ref="con1" :class="{ anim: animate == true }">
      <div v-for="(item, index) in items" :key="index">{{ item }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'text-scroll',
  data() {
    return {
      animate: false,
      items: [
        { name: '1' },
        { name: '2' },
        { name: '3' },
        { name: '4' },
        { name: '5' },
        { name: '6' },
        { name: '7' },
        { name: '8' },
        { name: '9' },
        { name: '10', age: '18', sex: '男' },
        { name: '11' },
        { name: '12' },
        { name: '13' },
        { name: '14' },
        { name: '15' },
        { name: '17' },
        { name: '18' },
        { name: '19' },
        { name: '20' },
        { name: '21' },
      ],
    }
  },
  created() {
    setInterval(this.scroll, 1000)
  },
  methods: {
    scroll() {
      this.animate = true
      // 因为在消息向上滚动的时候需要添加css3过渡动画，所以这里需要设置true
      setTimeout(() => {
        //
        // 这里直接使用了es6的箭头函数，省去了处理this指向偏移问题，代码也比之前简化了很多
        this.items.push(this.items[0]) // 将数组的第一个元素添加到数组的
        this.items.shift() //删除数组的第一个元素
        this.animate = false // margin-top 为0
        // 的时候取消过渡动画，实现无缝滚动
      }, 500)
    },
  },
}
</script>

<style>
#box {
  width: 300px;
  height: 32px;
  overflow: hidden;
  padding-left: 30px;
  border: 1px solid black;
}
.anim {
  transition: all 0.5s linear;
  margin-top: -30px;
}
#con1 div {
  list-style: none;
  line-height: 30px;
  height: 30px;
  color: #000;
}
</style>
