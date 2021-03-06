<template>
  <transition name="list-fade">
    <div class="playlist"
         @click="hide"
         v-show="showFlag">
      <!-- @click.stop 停止事件的冒泡父级元素, 停止触发到父级click事件 -->
      <div class="list-wrapper"
           @click.stop>
        <div class="list-header">
          <h1 class="title">
            <i class="icon"
               :class="iconMode"
               @click="changeMode"></i>
            <span class="text">{{modeText}}</span>
            <!-- 清除全部歌曲 -->
            <span class="clear"
                  @click="showConfirm"><i class="icon-clear"></i></span>
          </h1>
        </div>
        <!-- 滚动条_ 多个歌曲播放时__十二时二十一分 -->
        <scroll ref="listContent"
                :data="sequenceList"
                class="list-content"
                :refreshDelay="refreshDelay">
          <!--  tag说明渲染为 ul 标签-->
          <transition-group ref="list"
                            name="list"
                            tag="ul">
            <!-- 遍历顺序的歌单 -->
            <li :key="item.id"
                class="item"
                v-for="(item,index) in sequenceList"
                @click="selectItem(item,index)">
              <!-- 根据item 的标签， 是否为当前的播放的歌曲 -->
              <i class="current"
                 :class="getCurrentIcon(item)"></i>
              <span class="text">{{item.name}}</span> <!-- 歌曲的中文 -->
              <!--切换 歌曲是否喜欢 -->
              <span @click.stop="toggleFavorite(item)"
                    class="like">
                <i :class="getFavoriteIcon(item)"></i>
              </span>
              <!-- 删除歌曲在列表中 -->
              <span @click.stop="deleteOne(item)"
                    class="delete">
                <i class="icon-delete"></i>
              </span>
            </li>
          </transition-group>
        </scroll>
        <div class="list-operate">
          <div @click="addSong"
               class="add">
            <i class="icon-add"></i>
            <span class="text">添加歌曲到队列</span>
          </div>
        </div>
        <div @click="hide"
             class="list-close">
          <span>关闭</span>
        </div>
      </div>
      <!-- 清空列表确认框 -->
      <confirm ref="confirm"
               @confirm="confirmClear"
               text="是否清空播放列表"
               confirmBtnText="清空"></confirm>
      <add-song ref="addSong"></add-song>
    </div>
  </transition>
</template>

<script type="text/ecmascript-6">
import { mapActions } from 'vuex'
import { playMode } from 'common/js/config'
import Scroll from 'base/scroll/scroll'
import Confirm from 'base/confirm/confirm'
import AddSong from 'components/add-song/add-song'
import { playerMixin } from 'common/js/mixin'

export default {
  // 相同的代码 封装在一个 文件中，多个组件公用
  mixins: [playerMixin],
  data () {
    return {
      // 是否显示的标识
      showFlag: false,
      refreshDelay: 120
    }
  },
  computed: {
    modeText () {
      return this.mode === playMode.sequence ? '顺序播放' : this.mode === playMode.random ? '随机播放' : '单曲循环'
    }
  },
  methods: {
    show () {
      this.showFlag = true
      // 显示的时候, 滚动条 重新计算高度 并 滚动到当前的播放的歌曲位置
      setTimeout(() => {
        this.$refs.listContent.refresh()
        this.scrollToCurrent(this.currentSong)
      }, 20)
    },
    hide () {
      this.showFlag = false
    },
    showConfirm () {
      this.$refs.confirm.show()
    },
    confirmClear () {
      this.deleteSongList()
      this.hide()
    },
    /**
     * 判断是否为当前的播放歌曲
     */
    getCurrentIcon (item) {
      if (this.currentSong.id === item.id) {
        return 'icon-play'
      }
      return ''
    },
    /*
      选择歌单的某个歌曲
      index 为顺序播放的 索引
     */
    selectItem (item, index) {
      // 播放模式为  随机模式, 需要去取 当前播放列表的索引值
      if (this.mode === playMode.random) {
        index = this.playlist.findIndex((song) => {
          return song.id === item.id
        })
      }
      // 重置播放的 歌曲索引
      this.setCurrentIndex(index)
      // 设置当前为 播放状态(暂停 模式下点击不会自动的播放)
      this.setPlayingState(true)
    },
    // 使播放列表滚动到当前播放歌曲 并且为第一位置
    scrollToCurrent (current) {
      // 找到 顺序列表的索引
      const index = this.sequenceList.findIndex((song) => {
        return current.id === song.id
      })
      let currentSongDom = this.$refs.list.$el.children[index]
      this.$refs.listContent.scrollToElement(
        currentSongDom, 300)
    },
    // 在列表中删除 指定歌曲
    deleteOne (item) {
      this.deleteSong(item)
      // 如果没有歌曲 则隐藏
      if (!this.playlist.length) {
        this.hide()
      }
    },
    addSong () {
      this.$refs.addSong.show()
    },
    ...mapActions([
      'deleteSong',
      'deleteSongList'
    ])
  },
  watch: {
    currentSong (newSong, oldSong) {
      // 如果没有显示 或  相同的歌曲
      if (!this.showFlag || newSong.id === oldSong.id) {
        return
      }
      setTimeout(() => {
        this.scrollToCurrent(newSong)
      }, 20)
    }
  },
  components: {
    Scroll,
    Confirm,
    AddSong
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
@import '~common/stylus/variable';
@import '~common/stylus/mixin';

.playlist {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 200;
  background-color: $color-background-d;

  &.list-fade-enter-active, &.list-fade-leave-active {
    transition: opacity 0.3s;

    .list-wrapper {
      transition: all 0.3s;
    }
  }

  &.list-fade-enter, &.list-fade-leave-to {
    opacity: 0;

    .list-wrapper {
      transform: translate3d(0, 100%, 0);
    }
  }

  &.list-fade-enter, .list-wrapper {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    background-color: $color-highlight-background;

    .list-header {
      position: relative;
      padding: 20px 30px 10px 20px;

      .title {
        display: flex;
        align-items: center;

        .icon {
          margin-right: 10px;
          font-size: 30px;
          color: $color-theme-d;
        }

        .text {
          flex: 1;
          font-size: $font-size-medium;
          color: $color-text-l;
        }

        .clear {
          extend-click();

          .icon-clear {
            font-size: $font-size-medium;
            color: $color-text-d;
          }
        }
      }
    }

    .list-content {
      max-height: 240px;
      overflow: hidden;

      .item {
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 30px 0 20px;
        overflow: hidden;

        &.list-enter-active, &.list-leave-active {
          transition: all 0.1s;
        }

        &.list-enter, &.list-leave-to {
          height: 0;
        }

        .current {
          flex: 0 0 20px;
          width: 20px;
          font-size: $font-size-small;
          color: $color-theme-d;
        }

        .text {
          flex: 1;
          no-wrap();
          font-size: $font-size-medium;
          color: $color-text-d;
        }

        .like {
          extend-click();
          margin-right: 15px;
          font-size: $font-size-small;
          color: $color-theme;

          .icon-favorite {
            color: $color-sub-theme;
          }
        }

        .delete {
          extend-click();
          font-size: $font-size-small;
          color: $color-theme;
        }
      }
    }

    .list-operate {
      width: 140px;
      margin: 20px auto 30px auto;

      .add {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        border: 1px solid $color-text-l;
        border-radius: 100px;
        color: $color-text-l;

        .icon-add {
          margin-right: 5px;
          font-size: $font-size-small-s;
        }

        .text {
          font-size: $font-size-small;
        }
      }
    }

    .list-close {
      text-align: center;
      line-height: 50px;
      background: $color-background;
      font-size: $font-size-medium-x;
      color: $color-text-l;
    }
  }
}
</style>