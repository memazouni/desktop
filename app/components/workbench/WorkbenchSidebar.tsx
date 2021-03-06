import * as React from 'react'
import { Action, bindActionCreators, Dispatch } from 'redux'
import { connect } from 'react-redux'
import { CSSTransition } from 'react-transition-group'
import classNames from 'classnames'

import { QriRef } from '../../models/qriRef'
import { VersionInfo, PageInfo } from '../../models/store'

import { setActiveTab } from '../../actions/selections'

import { selectHistory, selectVersionInfoFromWorkingDataset } from '../../selections'

import ComponentList from './WorkingComponentList'
import DatasetReference from '../DatasetReference'
import Spinner from '../chrome/Spinner'
import WorkbenchLogList from './WorkbenchLogList'
import DatasetDetailsSubtext from '../dataset/DatasetDetailsSubtext'

export interface WorkbenchSidebarData {
  versionInfo: VersionInfo
  historyInfo: PageInfo
  historyLength: number
}

export interface WorkbenchSidebarProps {
  qriRef: QriRef
  data: WorkbenchSidebarData

  // setting actions
  setActiveTab: (activeTab: string) => Action
}

export const WorkbenchSidebarComponent: React.FunctionComponent<WorkbenchSidebarProps> = (props) => {
  const {
    qriRef,
    data,

    setActiveTab
  } = props

  const { historyInfo, historyLength, versionInfo } = data

  const {
    username = '',
    name = ''
  } = qriRef

  const activeTab = qriRef.path ? 'history' : 'status'

  const datasetSelected = username !== '' && name !== ''

  const historyToolTip = historyLength !== 0 || !datasetSelected ? 'Explore older versions of this dataset' : 'This dataset has no previous versions'

  // if no dataset is selected, what to return

  return (
    <div className='sidebar'>
      <div className='sidebar-header sidebar-padded-container'>
        <p className='pane-title'>Dataset</p>
        <DatasetReference qriRef={qriRef} />
        <DatasetDetailsSubtext data={versionInfo} />
      </div>
      <div id='tabs' className='sidebar-padded-container'>
        <div
          id='status-tab'
          className={classNames('tab', { 'active': activeTab === 'status' && datasetSelected, 'disabled': !datasetSelected })}
          onClick={() => {
            if (datasetSelected) {
              setActiveTab('status')
            }
          }}
          data-tip='View the working changes<br/> to this dataset&apos;s components'
        >
          Status
        </div>
        <div
          id='history-tab'
          className={classNames('tab', { 'active': activeTab === 'history', 'disabled': (historyInfo.error && historyInfo.error.includes('no history')) || !datasetSelected })}
          onClick={() => {
            if ((!(historyInfo.error && historyInfo.error.includes('no history')) && datasetSelected)) {
              setActiveTab('history')
            }
          }}
          data-tip={historyToolTip}
        >
          History {/* <div className='badge'>TODO (chriswhong): use this badge to show "new commits"</div> */}
        </div>
      </div>
      <div id='content' className='transition-group'>
        <CSSTransition
          classNames='fade'
          in={activeTab === 'history' && historyInfo.isFetching}
          component='div'
          timeout={300}
          mountOnEnter
          unmountOnExit
        >
          <div className='spinner'><Spinner white /></div>
        </CSSTransition>
        <CSSTransition
          in={activeTab === 'status'}
          classNames='fade'
          component='div'
          timeout={300}
          mountOnEnter
          unmountOnExit
        >
          <div id='status-content' className='sidebar-content'>
            <ComponentList qriRef={qriRef} />
          </div>
        </CSSTransition>
        <CSSTransition
          in={activeTab === 'history' && !historyInfo.isFetching}
          classNames='fade'
          component='div'
          timeout={300}
          mountOnEnter
          unmountOnExit
        >
          <WorkbenchLogList qriRef={qriRef} />
        </CSSTransition>
      </div>
    </div>
  )
}

const mapStateToProps = (state: any, ownProps: WorkbenchSidebarProps) => {
  const history = selectHistory(state)
  return {
    ...ownProps,
    data: {
      historyInfo: history.pageInfo,
      historyLength: history.value.length,
      versionInfo: selectVersionInfoFromWorkingDataset(state)
    }
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => {
  return bindActionCreators({
    setActiveTab
  }, dispatch)
}

const mergeProps = (props: any, actions: any): WorkbenchSidebarProps => {
  return { ...props, ...actions }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(WorkbenchSidebarComponent)
