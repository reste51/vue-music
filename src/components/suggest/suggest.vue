<template>
  <scroll ref="suggest"
          class="suggest"
          :data="result"
          :pullup="pullup"
          :beforeScroll="beforeScroll"
          @scrollToEnd="searchMore"
          @beforeScroll="listScroll">
    <ul class="suggest-list">
      <li @click="selectItem(item)"
          :key="item"
          class="suggest-item"
          v-for="item in result">
        <div class="icon">
          <i :class="getIconCls(item)"></i>
        </div>
        <div class="name">
          <p class="text"
             v-html="getDisplayName(item)"></p>
        </div>
      </li>
      <loading v-show="hasMore"
               title=""></loading>
    </ul>
    <div v-show="!hasMore && !result.length"
         class="no-result-wrapper">
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
import Scroll from 'base/scroll/scroll'
import Loading from 'base/loading/loading'
import NoResult from 'base/no-result/no-result'
import { search } from 'api/search'
import { ERR_OK } from 'api/config'
import { createSong } from 'common/js/song'
import { mapMutations, mapActions } from 'vuex'
import Singer from 'common/js/singer'

const TYPE_SINGER = 'singer'
const perpage = 20

export default {
  props: {
    // 是否展示 歌手
    showSinger: {
      type: Boolean,
      default: true
    },
    // 待查询的词汇
    query: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      page: 1,
      pullup: true,
      beforeScroll: true,
      hasMore: true,
      result: []
    }
  },
  methods: {
    refresh () {
      this.$refs.suggest.refresh()
    },
    search () {
      // 第一次查询时, 页号重置1
      this.page = 1
      // 搜索时 认为是  拥有更多
      this.hasMore = true
      this.$refs.suggest.scrollTo(0, 0)
      search(this.query, this.page, this.showSinger, perpage).then((res) => {
        if (res.code === ERR_OK) {
          this.result = this._genResult(res.data)
          // 检查是否_ 拥有更多数据
          this._checkMore(res.data)
        }
      })
    },
    // 下拉搜索更多
    searchMore () {
      if (!this.hasMore) {
        return
      }
      this.page++
      search(this.query, this.page, this.showSinger, perpage).then((res) => {
        if (res.code === ERR_OK) {
          this.result = this.result.concat(this._genResult(res.data))
          this._checkMore(res.data)
        }
      })
    },
    listScroll () {
      this.$emit('listScroll')
    },
    /**
     * 点击搜索出的 栏目
     * 1. 搜索为 歌手，  跳出 歌手详情页面
     * 2. 点击 歌曲时， 在播放列表插入 该歌曲
     */
    selectItem (item) {
      // 为歌手, 则跳转歌曲 路由
      if (item.type === TYPE_SINGER) {
        const singer = new Singer({
          id: item.singermid,
          name: item.singername
        })
        // 跳转为 歌手详情
        this.$router.push({
          path: `/search/${singer.id}`
        })
        // 通过vuex 传递歌手的数据
        this.setSinger(singer)
      } else {
        // 为歌曲, 则插入播放列表中
        this.insertSong(item)
      }
      // 派发点击事件_ 以便存储歌曲历史
      this.$emit('select', item)
    },
    // 显示 歌曲或 歌手的名称
    getDisplayName (item) {
      // 只显示 歌手名
      if (item.type === TYPE_SINGER) {
        return item.singername
      } else {
        // 歌曲名 - 歌手
        return `${item.name}-${item.singer}`
      }
    },
    // 获取 图标
    getIconCls (item) {
      // 为歌手的图标
      if (item.type === TYPE_SINGER) {
        return 'icon-mine'
      } else {
        // 歌曲的图标
        return 'icon-music'
      }
    },
    // 处理 接口返回的数据
    _genResult (data) {
      let ret = []
      // 是否查询的是歌手
      if (data.zhida && data.zhida.singerid) {
        ret.push({ ...data.zhida, ...{ type: TYPE_SINGER } })
      }
      // 歌曲
      if (data.song) {
        ret = ret.concat(this._normalizeSongs(data.song.list))
      }
      return ret
    },
    _normalizeSongs (list) {
      let ret = []
      list.forEach(musicData => {
        if (musicData.songid && musicData.albummid) {
          ret.push(createSong(musicData))
        }
      })
      return ret
    },
    _checkMore (data) {
      const song = data.song
      // 当总数 大于 歌曲总数， 认为 已经没有 更多
      if (!song.list.length || (song.curnum + song.curpage * perpage) > song.totalnum) {
        this.hasMore = false
      }
    },
    ...mapMutations({
      setSinger: 'SET_SINGER'
    }),
    ...mapActions([
      'insertSong'
    ])
  },
  watch: {
    // 查询词汇发生变化时, 则重新请求服务端数据
    query (newQuery) {
      this.search(newQuery)
    }
  },
  components: {
    Scroll,
    Loading,
    NoResult
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
@import '~common/stylus/variable';
@import '~common/stylus/mixin';

.suggest {
  height: 100%;
  overflow: hidden;

  .suggest-list {
    padding: 0 30px;

    .suggest-item {
      display: flex;
      align-items: center;
      padding-bottom: 20px;
    }

    .icon {
      flex: 0 0 30px;
      width: 30px;

      [class^='icon-'] {
        font-size: 14px;
        color: $color-text-d;
      }
    }

    .name {
      flex: 1;
      font-size: $font-size-medium;
      color: $color-text-d;
      overflow: hidden;

      .text {
        no-wrap();
      }
    }
  }

  .no-result-wrapper {
    position: absolute;
    width: 100%;
    top: 50%;
    transform: translateY(-50%);
  }
}
</style>