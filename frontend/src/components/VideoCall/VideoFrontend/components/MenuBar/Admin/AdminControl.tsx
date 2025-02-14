import React, { useCallback, useState, useEffect } from 'react';

import {
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  FormControl,
  FormLabel,
  Input,
  Box,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
  HStack
} from '@chakra-ui/react';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import useCoveyAppState from '../../../../../../hooks/useCoveyAppState';
import useMaybeVideo from '../../../../../../hooks/useMaybeVideo';
import Player from '../../../../../../classes/Player';
import {PlayerUpdateRequest} from '../../../../../../classes/TownsServiceClient';

const AdminControl: React.FunctionComponent = () => {
  const {isOpen, onOpen, onClose} = useDisclosure()
  const video = useMaybeVideo()
  const {currentTownID, currentTownFriendlyName, myPlayerID, players, apiClient, askedToBecomeAdmin} = useCoveyAppState();
  const [townPassword, setTownPassword] = useState<string>('');
  const [privilegeMap, setPrivilegeMap] = useState(new Map<string, Player| undefined>());
  const [adminRequestMap, setAdminRequestMap] = useState(new Map<string, Player| undefined>());

  const toast = useToast();

  const openSettings = useCallback(()=>{
    onOpen();
    video?.pauseGame();
  }, [onOpen, video]);

  const closeSettings = useCallback(()=>{
    onClose();
    setTownPassword('');
    video?.unPauseGame();
  }, [onClose, video]);

  const handleBan = async (playerId: string) => {
    try {
      await apiClient.banPlayer({coveyTownID:currentTownID, coveyTownPassword:townPassword, userId:myPlayerID, playerId});
    } catch (err) {
      toast({
        title: 'Unable to connect to Towns Service',
        description: err.toString(),
        status: 'error'
      })
    }
  };

  const handleEmptyTown = async () => {
    try {
      await apiClient.emptyTown({coveyTownID:currentTownID, coveyTownPassword:townPassword, userId:myPlayerID});
    } catch (err) {
      toast({
        title: 'Unable to connect to Towns Service',
        description: err.toString(),
        status: 'error'
      })
    }
  };

  const handlePlayerModify = async (playerUpdate: PlayerUpdateRequest) => {
    try {
      await apiClient.modifyPlayer(playerUpdate);
    } catch (err) {
      toast({
        title: 'Unable to modify player',
        description: err.toString(),
        status: 'error'
      })
    }
  };

  const handleAudioBan = async (playerId: string) => {
    handlePlayerModify({coveyTownID:currentTownID, coveyTownPassword: townPassword,userId:myPlayerID, playerId, audioAccess:false});
  };

  const handleVideoBan = async (playerId: string) => {
    handlePlayerModify({coveyTownID:currentTownID, coveyTownPassword: townPassword,userId:myPlayerID, playerId, videoAccess:false});
  };

  const handleChatBan = async (playerId: string) => {
    handlePlayerModify({coveyTownID:currentTownID, coveyTownPassword: townPassword,userId:myPlayerID, playerId, chatAccess:false});
  };

  const promoteToAdmin = async (playerId: string) => {
    handlePlayerModify({coveyTownID:currentTownID, coveyTownPassword: townPassword,userId:myPlayerID, playerId, isAdmin:true});
  };

  const handleAllAudioBan = async () => {
    players.filter(p=>!p.privileges?.admin).map((player)=>{handlePlayerModify({coveyTownID:currentTownID, coveyTownPassword: townPassword,userId:myPlayerID, playerId: player.id, audioAccess:false});});
  };

  const handleAllVideoBan = async () => {
    players.filter(p=>!p.privileges?.admin).map((player)=>{handlePlayerModify({coveyTownID:currentTownID, coveyTownPassword: townPassword,userId:myPlayerID, playerId: player.id, videoAccess:false});});
  };

  const handleAllChatBan = async () => {
    players.filter(p=>!p.privileges?.admin).map((player)=>{handlePlayerModify({coveyTownID:currentTownID, coveyTownPassword: townPassword,userId:myPlayerID, playerId: player.id, chatAccess:false});});
  };

  useEffect(() => {
    players?.map((player) => {
      setPrivilegeMap(privilegeMap.set(player.id, player));
    });
  },[players]);

  useEffect(() => {
    const me = players.find(player=>player.id===myPlayerID);
    if( me?.privileges?.admin){
      askedToBecomeAdmin?.map((player) => {
        if(!adminRequestMap.has(player.id)){
          setAdminRequestMap(adminRequestMap.set(player.id, player));
          toast({
            title: 'Admin Request',
            description: `${player.userName} asked to become an Admin.`,
            status: 'info',
            duration: 10000,
            isClosable: true,
            position: 'bottom-left'
          })
        }
      });
    }
    
  },[askedToBecomeAdmin]);

  return <>
    <form>
    <MenuItem data-testid='openMenuButton' onClick={openSettings}>
      <Typography variant="body1">Admin Controls</Typography>
    </MenuItem>
    <Modal isOpen={isOpen} onClose={closeSettings} size="6xl">
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader>Admin Controls for {currentTownFriendlyName} ({currentTownID})</ModalHeader>
        <ModalCloseButton/>        
          <ModalBody pb={6}>
          <FormControl>
              <FormLabel htmlFor="townPassword">Town Password</FormLabel>
              <Input id="townPassword" autoFocus name="townPassword" placeholder="Town Password"
                     value={townPassword}
                     onChange={(event) => setTownPassword(event.target.value) } type="password"
              />
            </FormControl>
          <Table>
                <Thead><Tr><Th>User Name</Th><Th>User ID</Th><Th>Type</Th><Th>Ban/Kick</Th><Th>Disable Controls</Th><Th>Promote</Th></Tr></Thead>
                <Tbody>
                  {players?.map((player) => (
                    <Tr key={player.id}><Td role='cell'>{player.userName}</Td><Td
                      role='cell'>{player.id}</Td>
                      <Td role='cell'>{player.privileges?.admin?'Admin': 'Attendee'}</Td>
                      <Td role="cell"> 
                        <Button colorScheme="red" size="md" isDisabled={privilegeMap.get(player.id)?.privileges?.admin} onClick={() => handleBan(player.id)}>Ban</Button>
                      </Td>
                        <Td role='cell'>
                          <Box>
                            <HStack>
                              <Button colorScheme={privilegeMap.get(player.id)?.privileges?.video?'green':'red'} isDisabled={privilegeMap.get(player.id)?.privileges?.admin} onClick={()=> handleVideoBan(player.id)} >Video</Button>
                              <Button colorScheme={privilegeMap.get(player.id)?.privileges?.audio?'green':'red'} isDisabled={privilegeMap.get(player.id)?.privileges?.admin} onClick={()=> handleAudioBan(player.id)} >Audio</Button>
                              <Button colorScheme={privilegeMap.get(player.id)?.privileges?.chat?'green':'red'} isDisabled={privilegeMap.get(player.id)?.privileges?.admin} onClick={()=> handleChatBan(player.id)} >Chat</Button>
                            </HStack>
                          </Box>
                        </Td>
                        <Td role="cell">
                          {!privilegeMap.get(player.id)?.privileges?.admin && <Button colorScheme='green' onClick={()=>promoteToAdmin(player.id)} >Make Admin</Button>}
                        </Td>
                        </Tr>
                  ))}
                </Tbody>
              </Table>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" size="md" mr={6} onClick={() => handleEmptyTown()}>Empty Town</Button>
            <Button colorScheme="red" size="md" mr={6} onClick={() => handleAllAudioBan()}>Mute All</Button>
            <Button colorScheme="red" size="md" mr={6} onClick={() => handleAllVideoBan()}>Disable All Video</Button>
            <Button colorScheme="red" size="md" mr={6} onClick={() => handleAllChatBan()}>Disable All Chat</Button>
            <Button onClick={closeSettings}>Close</Button>
          </ModalFooter>
      </ModalContent>
    </Modal>
    </form>
  </>
}


export default AdminControl;
