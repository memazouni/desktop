import * as React from 'react'
import { Action } from 'redux'
import moment from 'moment'
import { CSSTransition } from 'react-transition-group'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

import { ApiActionThunk } from '../store/api'
import SaveFormContainer from '../containers/SaveFormContainer'
import ComponentList from './ComponentList'

import classNames from 'classnames'
import Spinner from './chrome/Spinner'

import { WorkingDataset, ComponentType, Selections } from '../models/store'

interface HistoryListItemProps {
  path: string
  commitTitle: string
  timeMessage: string
  selected: boolean
  onClick: (type: string, selectedListItem: string) => Action
}

const HistoryListItem: React.FunctionComponent<HistoryListItemProps> = (props) => {
  return (
    <div
      className={`sidebar-list-item sidebar-list-item-text ${props.selected && 'selected'}`}
      onClick={() => { props.onClick('commit', props.path) }}
    >
      <div className='text-column'>
        <div className='text'>{props.commitTitle}</div>
        <div className='subtext'>
          {/* Bring back avatar later <img className= 'user-image' src = {props.avatarUrl} /> */}
          <div className='time-message'>
            {props.timeMessage}
          </div>
        </div>
      </div>
    </div>
  )
}

export interface DatasetSidebarProps {
  selections: Selections
  workingDataset: WorkingDataset
  hideCommitNudge: boolean
  setActiveTab: (activeTab: string) => Action
  setSelectedListItem: (type: ComponentType, activeTab: string) => Action
  fetchWorkingHistory: (page?: number, pageSize?: number) => ApiActionThunk
  discardChanges: (component: ComponentType) => ApiActionThunk
  setHideCommitNudge: () => Action
}

const DatasetSidebar: React.FunctionComponent<DatasetSidebarProps> = (props) => {
  const {
    selections,
    workingDataset,
    hideCommitNudge,
    setActiveTab,
    setSelectedListItem,
    fetchWorkingHistory,
    discardChanges,
    setHideCommitNudge
  } = props

  const { path, linkpath, history, status } = workingDataset

  const {
    activeTab,
    component: selectedComponent,
    commitComponent: selectedCommit,
    isLinked
  } = selections

  const historyLoaded = !!history
  const statusLoaded = !!status

  const noHistory = history.value.length === 0

  const handleHistoryScroll = (e: any) => {
    if (!(history && history.pageInfo)) {
      fetchWorkingHistory()
      return
    }
    if (e.target.scrollHeight === parseInt(e.target.scrollTop) + parseInt(e.target.offsetHeight)) {
      fetchWorkingHistory(history.pageInfo.page + 1, history.pageInfo.pageSize)
    }
  }

  return (
    <div className='dataset-sidebar'>
      <div id='tabs' className='sidebar-list-item'>
        <div
          className={classNames('tab', { 'active': activeTab === 'status' })}
          onClick={() => { setActiveTab('status') }}
          data-tip='View the latest version or working changes<br/> to this dataset&apos;s components'
        >
          Status
        </div>
        <div
          className={classNames('tab', { 'active': activeTab === 'history', 'disabled': history.pageInfo.error && history.pageInfo.error.includes('no history') })}
          onClick={() => {
            if (!(history.pageInfo.error && history.pageInfo.error.includes('no history'))) {
              setActiveTab('history')
            }
          }}
          data-tip={path ? 'Explore older versions of this dataset' : 'This dataset has no previous versions'}
        >
          History
        </div>
      </div>
      <div id='content'>
        <CSSTransition
          in={(!statusLoaded && activeTab === 'status') || (!historyLoaded && activeTab === 'history')}
          classNames='fade'
          component='div'
          timeout={300}
          unmountOnExit
        >
          <Spinner />
        </CSSTransition>
        <CSSTransition
          in={statusLoaded && activeTab === 'status'}
          classNames='fade'
          component='div'
          timeout={300}
          unmountOnExit
        >
          <div id='status-content' className='sidebar-content'>
            <ComponentList
              status={status}
              selectedComponent={selectedComponent}
              onComponentClick={setSelectedListItem}
              selectionType={'component' as ComponentType}
              isLinked={isLinked}
              linkpath={linkpath}
              discardChanges={discardChanges}
            />
          </div>
        </CSSTransition>
        <CSSTransition
          in={historyLoaded && activeTab === 'history'}
          classNames='fade'
          component='div'
          timeout={300}
          unmountOnExit
        >
          <div
            id='history-content'
            className='sidebar-content'
            onScroll={(e) => handleHistoryScroll(e)}
            hidden = {activeTab === 'status'}
          >
            {
              history.value.map(({ path, timestamp, title }) => {
                const timeMessage = moment(timestamp).fromNow()
                return (
                  <HistoryListItem
                    key={path}
                    path={path}
                    commitTitle={title}
                    timeMessage={timeMessage}
                    selected={selectedCommit === path}
                    onClick={setSelectedListItem}
                  />
                )
              })
            }
          </div>
        </CSSTransition>
        {
          !hideCommitNudge && noHistory && (
            <div className='commit-nudge'>
              <div className='commit-nudge-text'>
                You&apos;re ready to make your first commit on this dataset! Verify that the body and meta are accurate, enter a commit message below, and click Submit.
              </div>
              <a
                className="close dark"
                onClick={setHideCommitNudge}
                aria-label="close"
                role="button" >
                <FontAwesomeIcon icon={faTimes} size='lg'/>
              </a>
            </div>
          )
        }
      </div>
      {
        isLinked && activeTab === 'status' && <SaveFormContainer />
      }
    </div>
  )
}

export default DatasetSidebar
